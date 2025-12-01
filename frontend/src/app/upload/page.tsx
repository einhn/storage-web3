// frontend/src/app/upload/page.tsx
"use client";

import { useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type UploadResult = {
  cid: string;
  phash: string;
  size: string;
  groupId?: string;
  url: string;
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 데모용: 지갑 주소 하드코딩 (나중에 OAuth+custodial wallet로 대체)
  const userAddress = "0xa5842ef62a85bb2f7FA9235567451c2a84A0D0c9";

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userAddress", userAddress);

    try {
      const res = await fetch(`${API_BASE}/files/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "upload failed");
      }

      const data = await res.json();
      setResults((prev) => [data, ...prev]);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1>Image Upload (IPFS + pHash)</h1>

      <div style={{ marginBottom: "1rem" }}>
        <input type="file" accept="image/*" onChange={onFileChange} />
        <button
          onClick={onUpload}
          disabled={!file || loading}
          style={{ marginLeft: "0.5rem" }}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
      )}

      <div>
        {results.length > 0 && <h2>Recent uploads</h2>}
        {results.map((r, idx) => (
          <div
            key={r.cid + idx}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            <div>
              <strong>CID:</strong> {r.cid}
            </div>
            <div>
              <strong>Group:</strong> {r.groupId ?? "-"}
            </div>
            <div>
              <strong>Size:</strong> {r.size} bytes
            </div>
            <div>
              <strong>pHash:</strong>{" "}
              <code>{r.phash.slice(0, 32)}...</code>
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <a href={r.url} target="_blank" rel="noreferrer">
                Open via IPFS gateway
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}