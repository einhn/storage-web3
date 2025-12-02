// backend/src/jobs/monthlyBilling.ts
import { prisma } from "../lib/prisma";
import { commitMonthlyUsage as commitOnchain } from "../web3/usageBillingClient";
import * as crypto from "crypto";

// "매월 2일 10:00"에 실행된다고 가정하고
// 전달 2일 10:01 ~ 이번달 2일 10:00 구간 정산
// 예: now = 2025-12-02 10:00 KST
// => start = 2025-11-02 10:01 KST
// => end   = 2025-12-02 10:00 KST
// => billingYear = 2025, billingMonth = 11
function getRollingMonthRange(now: Date) {
  // now 기준으로 "앵커(anchor) 월"을 결정
  // day > 2: 이번달 2일 10시를 end 로 사용
  // day = 2 & time >= 10: 이번달 2일 10시를 end 로 사용
  // 그보다 이르면 → 한 달 전을 end 기준으로 사용 (지연 실행 대비)
  const kstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));

  const year = kstNow.getFullYear();
  const month = kstNow.getMonth() + 1; // 1~12
  const day = kstNow.getDate();
  const hour = kstNow.getHours();
  const minute = kstNow.getMinutes();

  let anchorYear = year;
  let anchorMonth = month;

  const isOnOrAfterAnchorTime =
    day > 2 ||
    (day === 2 && (hour > 10 || (hour === 10 && minute >= 0)));

  if (!isOnOrAfterAnchorTime) {
    if (month === 1) {
      anchorYear = year - 1;
      anchorMonth = 12;
    } else {
      anchorMonth = month - 1;
    }
  }

  // end: anchorYear-anchorMonth-02 10:00 KST
  const end = new Date(
    `${anchorYear}-${String(anchorMonth).padStart(2, "0")}-02T10:00:00+09:00`,
  );

  // start: end 기준 한 달 전의 2일 10:01 KST
  let startYear = anchorYear;
  let startMonth = anchorMonth - 1;
  if (startMonth === 0) {
    startMonth = 12;
    startYear -= 1;
  }

  const start = new Date(
    `${startYear}-${String(startMonth).padStart(2, "0")}-02T10:01:00+09:00`,
  );

  // 청구는 start 기준 한 달 단위
  const billingYear = startYear;
  const billingMonth = startMonth;

  return { billingYear, billingMonth, start, end };
}

async function main() {
  const now = new Date();
  const { billingYear, billingMonth, start, end } = getRollingMonthRange(now);

  console.log(
    `[monthlyBilling] billing ${billingYear}-${billingMonth}, range: ${start.toISOString()} ~ ${end.toISOString()}`,
  );

  // 1) 모든 유저 + 모든 업로드 기록을 가져온 뒤, JS에서 기간 필터링
  const users = await prisma.user.findMany({
    include: {
      userFiles: {
        include: {
          file: true,
        },
      },
    },
  });

  console.log("[DEBUG] total users in DB =", users.length);
  console.log(
    "[DEBUG] userIds =",
    users.map((u) => u.id.toString()),
  );

  // 2) 각 유저별로 "이번 정산 기간에 해당하는 업로드만" 추려서 사용
  let billedUserCount = 0;

  for (const user of users) {
    try {
      const walletAddress = user.walletAddress ?? null;

      console.log(
        `[DEBUG RAW] userId=${user.id.toString()}, totalUserFiles=${user.userFiles.length}`,
      );
      console.log(
        `[DEBUG RAW]   start=${start.toISOString()}, end=${end.toISOString()}`,
      );
      for (const uf of user.userFiles) {
        console.log(
          `[DEBUG RAW]   uploadedAt=${uf.uploadedAt.toISOString()}`,
        );
      }

      const filesInRange = user.userFiles.filter((uf) => {
        const ts = uf.uploadedAt;
        return ts >= start && ts < end;
      });

      console.log(
        `[DEBUG RANGE] userId=${user.id.toString()}, filesInRange=${filesInRange.length}`,
      );

      if (filesInRange.length === 0) {
        console.log(
          `[DEBUG] userId=${user.id.toString()} has no uploads in range`,
        );
        continue;
      }

      billedUserCount++;

      // 3) 기간 내 업로드 용량 합산
      let totalBytesBig = 0n;
      for (const uf of filesInRange) {
        totalBytesBig += uf.file.size; // BigInt
      }

      console.log(
        `[DEBUG] userId=${user.id.toString()}, wallet=${walletAddress ?? "NULL"}, filesInRange=${filesInRange.length}, bytes=${totalBytesBig.toString()}`,
      );

      // 예시 요금 정책: 1 byte = 1 wei
      const billedAmountBig = totalBytesBig;
      const billedAmountStr = billedAmountBig.toString();

      // 지갑 유무와 상관없이 스냅샷은 생성
      const hashSource = `${walletAddress ?? "no-wallet"}-${billingYear}-${billingMonth}-${totalBytesBig.toString()}-${billedAmountStr}`;

      const snapshotHash =
        "0x" +
        crypto.createHash("sha256").update(hashSource).digest("hex");

      // UsageSnapshot upsert
      let snapshot = await prisma.usageSnapshot.upsert({
        where: {
          userId_year_month: {
            userId: user.id,
            year: billingYear,
            month: billingMonth,
          },
        },
        update: {
          totalBytes: totalBytesBig,
          billedAmount: billedAmountStr,
          snapshotHash,
        },
        create: {
          userId: user.id,
          year: billingYear,
          month: billingMonth,
          totalBytes: totalBytesBig,
          billedAmount: billedAmountStr,
          snapshotHash,
        },
      });

      // 4) 지갑이 없으면 온체인 커밋을 생략 (스냅샷만 존재)
      if (!walletAddress) {
        console.warn(
          `[monthlyBilling] userId=${user.id.toString()} has no walletAddress; snapshot only, no on-chain commit`,
        );
        continue;
      }

      // 5) 지갑 있고 용량 0이면 온체인 커밋 스킵 (필요하면)
      if (totalBytesBig === 0n) {
        console.log(
          `[monthlyBilling] userId=${user.id.toString()} has 0 bytes; skipping on-chain commit (snapshot exists)`,
        );
        continue;
      }

      // 6) 온체인 commitMonthlyUsage 호출
      const receipt = await commitOnchain({
        user: walletAddress,
        year: billingYear,
        month: billingMonth,
        totalBytes: totalBytesBig,
        billedAmount: billedAmountBig,
        snapshotHash,
      });

      const txHash = receipt.hash;
      const blockNumber = receipt.blockNumber ?? null;

      snapshot = await prisma.usageSnapshot.update({
        where: { id: snapshot.id },
        data: {
          commitTxHash: txHash,
          commitBlock:
            blockNumber !== null ? BigInt(blockNumber) : null,
        },
      });

      console.log(
        `[monthlyBilling] user=${walletAddress}, bytes=${totalBytesBig.toString()}, tx=${txHash}`,
      );
    } catch (e: any) {
      console.error(
        `[monthlyBilling] userId=${user.id.toString()} error:`,
        e?.message ?? e,
      );
    }
  }

  console.log(
    `[monthlyBilling] done, billedUserCount=${billedUserCount} (with >=1 upload in range)`,
  );

  console.log("[monthlyBilling] done");
}

main()
  .catch((e) => {
    console.error("[monthlyBilling] fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });