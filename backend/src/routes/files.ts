// backend/src/routes/files.ts
import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { computePHash } from "../lib/phash";
import { addFileToIpfs } from "../lib/ipfs";
import { Prisma } from "@prisma/client";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /files/upload
 *
 * form-data:
 *   - file: 이미지 파일
 *   - userAddress: 0x... (지갑 주소)
 */
router.post(
  "/upload",
  upload.single("file"),
  async (req, res): Promise<void> => {
    try {
      const file = req.file;
      const userAddress = req.body.userAddress;

      if (!file) {
        res.status(400).json({ error: "file is required" });
        return;
      }

      if (!userAddress) {
        res.status(400).json({ error: "userAddress is required" });
        return;
      }

      if (!file.mimetype.startsWith("image/")) {
        res.status(400).json({ error: "only image uploads are allowed" });
        return;
      }

      const buffer = file.buffer;
      const size = BigInt(file.size);

      // 1) User 찾거나 생성
      let user = await prisma.user.findUnique({
        where: { walletAddress: userAddress },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            walletAddress: userAddress,
          },
        });
      }

      // 2) pHash 계산
      const phash = await computePHash(buffer);

      // 3) IPFS 업로드
      const cid = await addFileToIpfs(buffer);

      // 4) 파일 레코드 생성 (CID 기반 dedup)
      let fileRow = await prisma.file.findUnique({ where: { cid } });

      if (!fileRow) {
        const existingWithSamePHash = await prisma.file.findFirst({
          where: { phash },
          orderBy: { id: "asc" },
        });

        fileRow = await prisma.file.create({
          data: {
            cid,
            phash,
            size,
            groupId: existingWithSamePHash
              ? existingWithSamePHash.groupId ?? existingWithSamePHash.id
              : null,
          },
        });

        if (!fileRow.groupId) {
          fileRow = await prisma.file.update({
            where: { id: fileRow.id },
            data: {
              groupId: fileRow.id,
            },
          });
        }
      }

      // 5) UserFile 연결 (upsert)
      await prisma.userFile.upsert({
        where: {
          userId_fileId: {
            userId: user.id,
            fileId: fileRow.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          fileId: fileRow.id,
        },
      });

      // 6) 이번 달 UsageSnapshot에 delta 반영
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const totalBytesDelta = size;
      const billedDelta = new Prisma.Decimal(totalBytesDelta.toString());

      await prisma.usageSnapshot.upsert({
        where: {
          userId_year_month: {
            userId: user.id,
            year,
            month,
          },
        },
        update: {
          totalBytes: { increment: totalBytesDelta },
          billedAmount: { increment: billedDelta },
        },
        create: {
          userId: user.id,
          year,
          month,
          totalBytes: totalBytesDelta,
          billedAmount: billedDelta,
          snapshotHash: "0x" + "0".repeat(64),
        },
      });

      const gateway = process.env.IPFS_GATEWAY_URL || "https://ipfs.io/ipfs/";

      res.json({
        status: "ok",
        cid,
        phash,
        size: size.toString(),
        groupId: fileRow.groupId?.toString(),
        url: `${gateway}${cid}`,
      });
    } catch (err: any) {
      console.error("[/files/upload] error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;