// backend/src/lib/ipfs.ts

// 간단한 가짜 CID 생성
let counter = 0;

export async function addFileToIpfs(_buffer: Buffer): Promise<string> {
  counter += 1;
  // 실제 CID는 아니지만, "고유한 ID" 정도로만 쓰기
  return `FAKE_CID_${Date.now()}_${counter}`;
}