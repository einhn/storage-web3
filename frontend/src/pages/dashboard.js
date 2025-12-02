// frontend/src/pages/dashboard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

function formatBytes(bytesStr) {
  const n = Number(bytesStr);
  if (!Number.isFinite(n) || n < 0) return bytesStr;

  if (n >= 1073741824) {
    return (n / 1073741824).toFixed(2) + " GB";
  }
  if (n >= 1048576) {
    return (n / 1048576).toFixed(2) + " MB";
  }
  if (n >= 1024) {
    return (n / 1024).toFixed(2) + " KB";
  }
  return n + " B";
}

export default function Dashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [wallet, setWallet] = useState("");

  const [usage, setUsage] = useState(null);
  const [usageStatus, setUsageStatus] = useState("");

  const [files, setFiles] = useState([]);
  const [filesStatus, setFilesStatus] = useState("");

  // 1) 쿼리 or localStorage 에서 userId / wallet 가져오기
  useEffect(() => {
    if (!router.isReady) return;
    const { userId, wallet } = router.query;

    if (userId && wallet) {
      setUserId(userId);
      setWallet(wallet);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "storage-web3:user",
          JSON.stringify({ userId, wallet })
        );
      }
    } else {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("storage-web3:user");
        if (raw) {
          try {
            const saved = JSON.parse(raw);
            setUserId(saved.userId);
            setWallet(saved.wallet);
          } catch {
            // ignore
          }
        }
      }
    }
  }, [router.isReady, router.query]);

  // 2) userId가 준비되면 백엔드에서 이번 달 사용량 가져오기
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const fetchUsage = async () => {
      try {
        setUsageStatus("loading");
        const res = await fetch(`/api/usage/current?userId=${userId}`);
        if (!res.ok) {
          console.error("usage fetch failed", res.status);
          if (!cancelled) {
            setUsageStatus("error");
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setUsage(data);
          setUsageStatus("ok");
        }
      } catch (err) {
        console.error("usage fetch error", err);
        if (!cancelled) {
          setUsageStatus("error");
        }
      }
    };

    fetchUsage();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 3) userId가 준비되면 사용자가 올린 파일 목록 가져오기
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const fetchFiles = async () => {
      try {
        setFilesStatus("loading");
        const res = await fetch(`/api/files/list?userId=${userId}`);
        if (!res.ok) {
          console.error("files fetch failed", res.status);
          if (!cancelled) {
            setFilesStatus("error");
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setFiles(data.files || []);
          setFilesStatus("ok");
        }
      } catch (err) {
        console.error("files fetch error", err);
        if (!cancelled) {
          setFilesStatus("error");
        }
      }
    };

    fetchFiles();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div style={{ maxWidth: 640 }}>
      <h2>대시보드</h2>

      {/* 지갑 정보 */}
      <section style={{ marginTop: "1rem" }}>
        {wallet ? (
          <p>
            연결된 지갑: <code>{wallet}</code>
          </p>
        ) : (
          <p>지갑 정보를 불러오는 중...</p>
        )}
      </section>

      {/* 사용량 섹션 */}
      <section
        style={{
          marginTop: "1.5rem",
          padding: "1rem 1.25rem",
          borderRadius: "0.75rem",
          border: "1px solid #ddd",
          backgroundColor: "#fafafa",
        }}
      >
        <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>이번 달 사용량</h3>

        {usageStatus === "loading" && <p>사용량을 불러오는 중...</p>}
        {usageStatus === "error" && (
          <p style={{ color: "crimson" }}>
            사용량을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}
        {usageStatus === "ok" && usage && (
          <>
            <p style={{ margin: 0 }}>
              기준: {usage.year}년 {usage.month}월
            </p>
            <p style={{ margin: "0.25rem 0" }}>
              업로드된 용량:{" "}
              <strong>{formatBytes(usage.totalBytes)}</strong>{" "}
              <span style={{ color: "#666" }}>
                ({usage.totalBytes} bytes)
              </span>
            </p>
            <p style={{ margin: "0.25rem 0" }}>
              청구 예정 금액(오프체인 계산 기준):{" "}
              <strong>{usage.billedAmount}</strong> wei
            </p>
            {usage.commitTxHash ? (
              <p style={{ margin: "0.25rem 0", fontSize: "0.85rem" }}>
                온체인 커밋 Tx:{" "}
                <code>{usage.commitTxHash.slice(0, 10)}...</code>
              </p>
            ) : (
              <p style={{ margin: "0.25rem 0", fontSize: "0.85rem" }}>
                온체인 정산은 매달 2일입니다.
              </p>
            )}
          </>
        )}
      </section>

      {/* 업로드한 이미지 목록 */}
      <section
        style={{
          marginTop: "1.5rem",
          padding: "1rem 1.25rem",
          borderRadius: "0.75rem",
          border: "1px solid #ddd",
          backgroundColor: "#fff",
        }}
      >
        <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>
          업로드한 이미지 (IPFS)
        </h3>

        {filesStatus === "loading" && <p>이미지 목록을 불러오는 중...</p>}

        {filesStatus === "error" && (
          <p style={{ color: "crimson" }}>
            이미지 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {filesStatus === "ok" && files.length === 0 && (
          <p>아직 업로드한 이미지가 없습니다.</p>
        )}

        {filesStatus === "ok" && files.length > 0 && (
          <ul style={{ listStyle: "none", paddingLeft: 0, marginTop: "0.5rem" }}>
            {files.map((f) => (
              <li
                key={f.id}
                style={{
                  padding: "0.4rem 0",
                  borderBottom: "1px solid #eee",
                  fontSize: "0.9rem",
                }}
              >
                <div>
                  CID:{" "}
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: "underline" }}
                  >
                    {f.cid}
                  </a>
                </div>
                <div style={{ color: "#666" }}>
                  크기: {formatBytes(f.size)} ({f.size} bytes)
                  {f.uploadedAt && (
                    <>
                      {" · 업로드 시각: "}
                      {new Date(f.uploadedAt).toLocaleString()}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 업로드 페이지 링크 */}
      <section style={{ marginTop: "1.5rem" }}>
        <a href="/upload">이미지 업로드</a>
      </section>
    </div>
  );
}