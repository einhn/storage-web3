// backend/src/routes/billing.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import {
  commitMonthlyUsage as commitOnchain,
  settlePayment as settleOnchain,
} from "../web3/usageBillingClient";

const router = Router();

/**
 * POST /billing/commit
 *
 * 월별 사용량/청구 정보를:
 * 1) DB(User, UsageSnapshot)에 기록하고
 * 2) UsageBilling.commitMonthlyUsage 를 온체인으로 호출
 *
 * body:
 * {
 *   user: "0x...",             // 지갑 주소
 *   year: 2025,
 *   month: 12,
 *   totalBytes: "123456789",
 *   billedAmount: "1000000000000000",
 *   snapshotHash: "0x....dead"
 * }
 */
router.post("/commit", async (req, res) => {
  try {
    const {
      user,
      year,
      month,
      totalBytes,
      billedAmount,
      snapshotHash,
    } = req.body;

    // 최소한의 바디 검증
    if (
      !user ||
      year === undefined ||
      month === undefined ||
      totalBytes === undefined ||
      billedAmount === undefined ||
      !snapshotHash
    ) {
      return res.status(400).json({ error: "missing required fields" });
    }

    const yearNum = Number(year);
    const monthNum = Number(month);
    if (!Number.isInteger(yearNum) || !Number.isInteger(monthNum)) {
      return res.status(400).json({ error: "year/month must be integers" });
    }

    // 문자열/숫자 → BigInt/문자열로 정규화
    const totalBytesBig = BigInt(totalBytes);
    const billedAmountStr = String(billedAmount);
    const billedAmountBig = BigInt(billedAmount);

    // 1) User 찾거나 생성
    let dbUser = await prisma.user.findUnique({
      where: { walletAddress: user },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          walletAddress: user,
        },
      });
    }

    // 2) UsageSnapshot upsert (온체인 호출 전 상태 기록)
    let snapshot = await prisma.usageSnapshot.upsert({
      where: {
        userId_year_month: {
          userId: dbUser.id,
          year: yearNum,
          month: monthNum,
        },
      },
      update: {
        totalBytes: totalBytesBig,
        billedAmount: billedAmountStr,
        snapshotHash,
      },
      create: {
        userId: dbUser.id,
        year: yearNum,
        month: monthNum,
        totalBytes: totalBytesBig,
        billedAmount: billedAmountStr,
        snapshotHash,
      },
    });

    // 3) 온체인 트랜잭션
    const receipt = await commitOnchain({
      user,
      year: yearNum,
      month: monthNum,
      totalBytes: totalBytesBig,
      billedAmount: billedAmountBig,
      snapshotHash,
    });

    const txHash = receipt.hash;
    const blockNumber = receipt.blockNumber ?? null;

    // 4) DB에 온체인 결과 반영
    snapshot = await prisma.usageSnapshot.update({
      where: { id: snapshot.id },
      data: {
        commitTxHash: txHash,
        commitBlock: blockNumber !== null ? BigInt(blockNumber) : null,
      },
    });

    return res.json({
      status: "ok",
      txHash,
      blockNumber,
      snapshotId: snapshot.id.toString(),
    });
  } catch (err: any) {
    console.error("[/billing/commit] error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /billing/settle
 *
 * 결제 성공/실패 결과를:
 * 1) DB(UsageSnapshot.paid 등)에 반영하고
 * 2) UsageBilling.settlePayment 를 온체인으로 호출한다.
 *
 * body:
 * {
 *   user: "0x...",   // 지갑 주소
 *   year: 2025,
 *   month: 12,
 *   success: true
 * }
 */
router.post("/settle", async (req, res) => {
  try {
    const { user, year, month, success } = req.body;

    if (!user || year === undefined || month === undefined || success === undefined) {
      return res.status(400).json({ error: "missing required fields" });
    }

    const yearNum = Number(year);
    const monthNum = Number(month);
    if (!Number.isInteger(yearNum) || !Number.isInteger(monthNum)) {
      return res.status(400).json({ error: "year/month must be integers" });
    }

    // success가 문자열("true"/"false")로 올 수도 있으니 한 번 정규화
    const successBool =
      typeof success === "boolean"
        ? success
        : String(success).toLowerCase() === "true";

    // 1) User 찾기
    const dbUser = await prisma.user.findUnique({
      where: { walletAddress: user },
    });

    if (!dbUser) {
      return res.status(404).json({ error: "user not found" });
    }

    // 2) 해당 월의 UsageSnapshot 조회
    const snapshot = await prisma.usageSnapshot.findUnique({
      where: {
        userId_year_month: {
          userId: dbUser.id,
          year: yearNum,
          month: monthNum,
        },
      },
    });

    if (!snapshot) {
      return res.status(404).json({ error: "usage snapshot not found" });
    }

    // 3) 온체인 settlePayment 호출
    const receipt = await settleOnchain({
      user,
      year: yearNum,
      month: monthNum,
      success: successBool,
    });

    const txHash = receipt.hash;
    const blockNumber = receipt.blockNumber ?? null;

    // 4) DB에 settle 결과 반영
    const updated = await prisma.usageSnapshot.update({
      where: { id: snapshot.id },
      data: {
        paid: successBool,
        settleTxHash: txHash,
        settleBlock: blockNumber !== null ? BigInt(blockNumber) : null,
      },
    });

    return res.json({
      status: "ok",
      txHash,
      blockNumber,
      snapshotId: updated.id.toString(),
      paid: updated.paid,
    });
  } catch (err: any) {
    console.error("[/billing/settle] error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /billing/cron-commit
// 크론잡에서 호출하는 "모든 유저 월 정산" 엔드포인트
router.post("/cron-commit", async (req, res) => {
  try {
    const { year, month } = req.body;

    if (year === undefined || month === undefined) {
      return res.status(400).json({ error: "missing year/month" });
    }

    const yearNum = Number(year);
    const monthNum = Number(month);
    if (!Number.isInteger(yearNum) || !Number.isInteger(monthNum)) {
      return res.status(400).json({ error: "year/month must be integers" });
    }

    // 1) 모든 유저 가져오기
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      return res.json({
        status: "ok",
        message: "no users to bill",
      });
    }

    const results: {
      walletAddress: string | null;
      snapshotId?: string;
      txHash?: string;
      error?: string;
    }[] = [];

    // 2) 각 유저에 대해 순차적으로 처리 (프로토타입으로 단순하게 직렬 처리)
    for (const u of users) {
      try {
        const walletAddress = u.walletAddress;

        if (!walletAddress) {
        results.push({
            walletAddress: null,
            error: "user has no walletAddress; skipped on-chain commit",
        });
        continue;
        }
        // TODO: DailySnapshot 등에서 총 사용량/청구금액 계산
        // 일단 데모용 상수/임시 값 사용
        const totalBytesBig = BigInt("123456789");
        const billedAmountStr = "1000000000000000";
        const billedAmountBig = BigInt(billedAmountStr);

        const snapshotHash =
          "0x000000000000000000000000000000000000000000000000000000000000dead";

        // UsageSnapshot upsert
        let snapshot = await prisma.usageSnapshot.upsert({
          where: {
            userId_year_month: {
              userId: u.id,
              year: yearNum,
              month: monthNum,
            },
          },
          update: {
            totalBytes: totalBytesBig,
            billedAmount: billedAmountStr,
            snapshotHash,
          },
          create: {
            userId: u.id,
            year: yearNum,
            month: monthNum,
            totalBytes: totalBytesBig,
            billedAmount: billedAmountStr,
            snapshotHash,
          },
        });

        // 온체인 commit
        const receipt = await commitOnchain({
          user: walletAddress,
          year: yearNum,
          month: monthNum,
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
            commitBlock: blockNumber !== null ? BigInt(blockNumber) : null,
          },
        });

        results.push({
          walletAddress,
          snapshotId: snapshot.id.toString(),
          txHash,
        });
      } catch (e: any) {
        console.error("[/billing/cron-commit] per-user error:", e);
        results.push({
          walletAddress: u.walletAddress,
          error: e.message ?? String(e),
        });
      }
    }

    return res.json({
      status: "ok",
      year: yearNum,
      month: monthNum,
      count: results.length,
      results,
    });
  } catch (err: any) {
    console.error("[/billing/cron-commit] error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;