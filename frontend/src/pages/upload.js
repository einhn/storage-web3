// frontend/src/pages/upload.js
import { useState } from "react";

export default function Upload() {
  const [userAddress, setUserAddress] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    if (!selectedFile) {
      setStatus("파일을 선택해 주세요.");
      return;
    }
    if (!userAddress) {
      setStatus("사용자 지갑 주소를 입력해 주세요.");
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
          (json && json.ipfsCid ? ` (CID: ${json.ipfsCid})` : ""),
      );
    } catch (err) {
      setStatus("에러: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <h2>이미지 업로드</h2>
      <p style={{ marginTop: "0.75rem", color: "#555" }}>
        예시 이미지를 업로드하면 백엔드에서 pHash 계산, IPFS 업로드,
        <br />
        DB(UserFile)에 메타데이터를 저장하는 흐름으로 확장할 예정입니다.
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
        <label style={{ fontSize: "0.9rem" }}>
          사용자 지갑 주소
          <input
            type="text"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            placeholder="0x로 시작하는 주소"
            style={{
              width: "100%",
              marginTop: "0.25rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #ccc",
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