// frontend/src/pages/index.js
export default function Home() {
  const handleTest = async () => {
    try {
      const res = await fetch("/api/health");
      alert("백엔드 응답 상태 코드: " + res.status);
    } catch (e) {
      alert("백엔드 호출 실패: " + e.message);
    }
  };

  return (
    <div style={{ textAlign: "center", maxWidth: 520 }}>
      <h1>storage-web3 prototype</h1>
      <p style={{ marginTop: "0.75rem", color: "#555" }}>
        Arbitrum Sepolia에 온체인 사용량 청구를 올리고,
        <br />
        IPFS 기반 스토리지 사용량을 추적하는 데모입니다.
      </p>

      <button
        onClick={handleTest}
        style={{
          marginTop: "1.5rem",
          padding: "0.75rem 1.5rem",
          borderRadius: "999px",
          border: "1px solid #ccc",
          cursor: "pointer",
          fontSize: "0.95rem",
        }}
      >
        /api/health 테스트 호출
      </button>

      <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#666" }}>
        (백엔드에 /health 엔드포인트를 만들어두면 연결 확인용으로 쓸 수 있습니다.)
      </p>
    </div>
  );
}