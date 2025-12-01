// backend/src/web3/usageBillingClient.ts
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

type DeploymentInfo = {
  address: string;
  chainId: number;
  network: string;
  abi: any[];
};

// JSON 읽기
const deploymentPath = path.join(
  __dirname,
  "..",
  "..",
  "contracts",
  "deployed",
  "usageBilling.arbitrum-sepolia.json",
);

if (!fs.existsSync(deploymentPath)) {
  throw new Error(
    `UsageBilling deployment info not found at ${deploymentPath}`,
  );
}
const deployment: DeploymentInfo = JSON.parse(
  fs.readFileSync(deploymentPath, "utf8"),
);

const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC;
const privateKey = process.env.BACKEND_PRIVATE_KEY;

if (!privateKey) {
  throw new Error("BACKEND_PRIVATE_KEY is not set in .env");
}

const provider = new JsonRpcProvider(rpcUrl);
const wallet = new Wallet(privateKey, provider);

export const usageBilling = new Contract(
  deployment.address,
  deployment.abi,
  wallet,
);

// 편의용 래퍼 함수
export async function commitMonthlyUsage(params: {
  user: string;
  year: number;
  month: number;
  totalBytes: bigint;
  billedAmount: bigint;
  snapshotHash: string; // 0x-prefixed bytes32
}) {
  const { user, year, month, totalBytes, billedAmount, snapshotHash } = params;

  const tx = await usageBilling.commitMonthlyUsage(
    user,
    year,
    month,
    totalBytes,
    billedAmount,
    snapshotHash,
  );

  return tx.wait();
}

export async function settlePayment(params: {
  user: string;
  year: number;
  month: number;
  success: boolean;
}) {
  const { user, year, month, success } = params;

  const tx = await usageBilling.settlePayment(user, year, month, success);
  return tx.wait();
}