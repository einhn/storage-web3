// backend/src/routes/usage.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * GET /usage/current?userId=1
 *
 * 1) UsageSnapshot에 값이 있으면 그걸 사용
 * 2) 없으면 UserFile + File.size 기준으로 이번 달 사용량을 on-the-fly로 계산해서 반환
 *
 * 발표용으로는 2025-12-02 13:00(KST) 기준까지만 집계하는 cutoff를 고정해 둘 수도 있다.
 */
router.get("/current", async (req, res) => {
  try {
    const userIdParam = req.query.userId;

    if (!userIdParam) {
      return res.status(400).json({ error: "userId query param is required" });
    }

    const rawUserId = Array.isArray(userIdParam)
      ? userIdParam[0]
      : userIdParam;

    if (typeof rawUserId !== "string" || rawUserId.trim() === "") {
      return res
        .status(400)
        .json({ error: "userId must be a non-empty string" });
    }

    const userId = BigInt(rawUserId);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const snapshot = await prisma.usageSnapshot.findUnique({
      where: {
        userId_year_month: {
          userId,
          year,
          month,
        },
      },
    });

    if (!snapshot) {
      return res.json({
        year,
        month,
        totalBytes: "0",
        billedAmount: "0",
        snapshotHash: null,
        commitTxHash: null,
        paid: false,
      });
    }

    return res.json({
      year: snapshot.year,
      month: snapshot.month,
      totalBytes: snapshot.totalBytes.toString(),
      billedAmount: snapshot.billedAmount.toString(),
      snapshotHash: snapshot.snapshotHash,
      commitTxHash: snapshot.commitTxHash,
      paid: snapshot.paid,
    });
  } catch (err) {
    console.error("GET /usage/current error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;