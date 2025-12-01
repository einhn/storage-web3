// backend/src/routes/billing.ts
import { Router } from "express";
import {
  commitMonthlyUsage,
  settlePayment,
} from "../web3/usageBillingClient";

const router = Router();

// POST /billing/commit
router.post("/commit", async (req, res) => {
  try {
    const { user, year, month, totalBytes, billedAmount, snapshotHash } =
      req.body;

    // TODO: 여기서 user, year, month, totalBytes, billedAmount, snapshotHash 검증

    const receipt = await commitMonthlyUsage({
      user,
      year,
      month,
      totalBytes: BigInt(totalBytes),
      billedAmount: BigInt(billedAmount),
      snapshotHash,
    });

    res.json({
      status: "ok",
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /billing/settle
router.post("/settle", async (req, res) => {
  try {
    const { user, year, month, success } = req.body;

    const receipt = await settlePayment({
      user,
      year,
      month,
      success,
    });

    res.json({
      status: "ok",
      txHash: receipt.transactionHash,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;