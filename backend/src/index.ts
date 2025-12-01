// backend/src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import billingRouter from "./routes/billing";
import filesRouter from "./routes/files";
import cookieParser from "cookie-parser";
import authGoogleRouter from "./routes/authGoogle";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/billing", billingRouter);

app.use("/files", filesRouter);

app.use("/auth", authGoogleRouter);

app.listen(PORT, () => {
  console.log(`[backend] listening on port ${PORT}`);
});