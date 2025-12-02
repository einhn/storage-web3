// backend/src/routes/usage.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * GET /usage/current?userId=1
 * - 해당 user의 “이번 달” 사용량 요약
 */
// backend/src/routes/usage.ts
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
      // 이번 달 업로드가 아직 없을 때
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
      totalBytes: snapshot.totalBytes.toString(),      // BigInt → string
      billedAmount: snapshot.billedAmount.toString(),  // Decimal → string
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