// backend/src/lib/wallet.ts
import { JsonRpcProvider, Wallet } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const RPC_URL =
  process.env.ARBITRUM_SEPOLIA_RPC ??
  "https://sepolia-rollup.arbitrum.io/rpc";

// 로컬 프로토타입용. 실제 서비스면 k8s secret 등으로 관리해야 함.
const WALLET_ENCRYPTION_SECRET =
  process.env.WALLET_ENCRYPTION_SECRET ?? "dev-secret";

const provider = new JsonRpcProvider(RPC_URL);

/**
 * 새 유저용 지갑 생성 + 암호화 JSON 반환
 */
export async function createUserWallet() {
  const wallet = Wallet.createRandom();
  const encryptedJson = await wallet.encrypt(WALLET_ENCRYPTION_SECRET);

  return {
    address: await wallet.getAddress(),
    encryptedJson,
  };
}

/**
 * DB에 저장된 encryptedJson으로부터 signer 복원
 */
export async function loadUserWallet(encryptedJson: string) {
  const wallet = await Wallet.fromEncryptedJson(
    encryptedJson,
    WALLET_ENCRYPTION_SECRET,
  );
  return wallet.connect(provider);
}