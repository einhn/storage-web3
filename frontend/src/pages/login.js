// frontend/src/pages/login.js

export default function Login() {
  const handleLogin = () => {
    // 프론트에서는 /api/... 만 쓰면 되고
    // next.config.js rewrites가 백엔드로 프록시해줌
    window.location.href = "/api/auth/google/start";
  };

  return (
    <div style={{ textAlign: "center", maxWidth: 420 }}>
      <h2>로그인</h2>
      <p style={{ marginTop: "0.75rem", color: "#555" }}>
        Google 계정으로 로그인하면, 백엔드에서 자동으로
        <br />
        전용 지갑을 생성하고 온체인 청구에 연결합니다.
      </p>

      <button
        onClick={handleLogin}
        style={{
          marginTop: "1.5rem",
          padding: "0.75rem 1.5rem",
          borderRadius: "999px",
          border: "1px solid #ccc",
          cursor: "pointer",
          fontSize: "0.95rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span>🔐</span>
        <span>Google로 로그인</span>
      </button>

      <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#888" }}>
      </p>
    </div>
  );
}