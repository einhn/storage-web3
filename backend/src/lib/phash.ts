// backend/src/lib/phash.ts
import sharp from "sharp";

/**
 * 간단한 aHash 기반 pHash 구현
 * - 32x32 그레이스케일로 리사이즈
 * - 평균 밝기보다 크면 1, 작으면 0
 * - 32x32 = 1024bit → hex 문자열로 리턴
 */
export async function computePHash(buffer: Buffer): Promise<string> {
  const size = 32;

  const img = sharp(buffer)
    .resize(size, size, { fit: "fill" })
    .grayscale();

  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  // data: Uint8Array, 길이 = size * size (각 픽셀 0~255)

  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  const avg = sum / data.length;

  // bitstring 생성
  let bits = "";
  for (let i = 0; i < data.length; i++) {
    bits += data[i] > avg ? "1" : "0";
  }

  // 4비트씩 끊어서 hex 로 변환
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    const chunk = bits.slice(i, i + 4);
    const val = parseInt(chunk, 2);
    hex += val.toString(16);
  }

  return hex; // 예: "f0a3..." (길이 256 characters)
}