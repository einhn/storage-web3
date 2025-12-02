// frontend/src/pages/upload.js
import { useEffect, useState } from "react";

export default function Upload() {
  const [userAddress, setUserAddress] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("");

  // 🔑 로그인 시 저장해둔 wallet 자동으로 불러오기
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("storage-web3:user");
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved.wallet) {
          setUserAddress(saved.wallet);
        }
      } catch {}
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    if (!selectedFile) {
      setStatus("파일을 선택해 주세요.");
      return;
    }
    if (!userAddress) {
      setStatus("지갑 주소를 찾을 수 없습니다. 다시 로그인해 주세요.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("userAddress", userAddress);

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        setStatus("업로드 실패: " + text);
        return;
      }

      const json = await res.json().catch(() => null);
      setStatus(
        "업로드 성공" +
          (json && json.ipfsCid ? ` (CID: ${json.ipfsCid})` : "")
      );
    } catch (err) {
      setStatus("에러: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <h2>이미지 업로드</h2>
      <p style={{ marginTop: "0.75rem", color: "#555" }}>
        로그인한 계정에 연결된 지갑으로 사용량을 기록합니다.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {/* ❗ 지갑 주소는 자동으로 세팅하고, 그냥 읽기 전용으로만 보여주기 */}
        <label style={{ fontSize: "0.9rem" }}>
          연결된 지갑 주소
          <input
            type="text"
            value={userAddress}
            readOnly
            style={{
              width: "100%",
              marginTop: "0.25rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #ccc",
              backgroundColor: "#f6f6f6",
            }}
          />
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          이미지 파일
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            style={{ marginTop: "0.25rem" }}
          />
        </label>

        <button
          type="submit"
          style={{
            marginTop: "0.5rem",
            padding: "0.6rem 1.2rem",
            borderRadius: "999px",
            border: "1px solid #ccc",
            cursor: "pointer",
            fontSize: "0.95rem",
            alignSelf: "flex-start",
          }}
        >
          업로드
        </button>
      </form>

      {status && (
        <p
          style={{
            marginTop: "1rem",
            fontSize: "0.9rem",
            color: status.startsWith("업로드 성공") ? "green" : "crimson",
          }}
        >
          {status}
        </p>
      )}
    </div>
  );
}