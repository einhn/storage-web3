// backend/src/lib/ipfs.ts
import type { IPFSHTTPClient } from "ipfs-http-client";

let ipfsClient: IPFSHTTPClient | null = null;

/**
 * ESM 전용 ipfs-http-client를 CJS/ts-node-dev 환경에서 쓰기 위해
 * 동적 import로 lazy하게 클라이언트를 생성
 */
async function getIpfsClient(): Promise<IPFSHTTPClient> {
  if (!ipfsClient) {
    const url = process.env.IPFS_API_URL;

    if (!url) {
      throw new Error("IPFS_API_URL is not set");
    }

    const module = await import("ipfs-http-client");
    const create = module.create ?? (module as any).default;

    if (!create) {
      throw new Error("Failed to load ipfs-http-client create()");
    }

    ipfsClient = create({ url }) as IPFSHTTPClient;
  }

  return ipfsClient;
}

// 버퍼를 IPFS에 업로드하고 CID 문자열을 반환
export async function addFileToIpfs(buffer: Buffer): Promise<string> {
  const client = await getIpfsClient();
  const { cid } = await client.add(buffer);
  return cid.toString();
}