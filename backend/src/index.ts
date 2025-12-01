// backend/src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import billingRouter from "./routes/billing";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/billing", billingRouter);

app.listen(PORT, () => {
  console.log(`[backend] listening on port ${PORT}`);
});