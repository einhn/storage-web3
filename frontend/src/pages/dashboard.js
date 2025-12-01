// frontend/src/pages/dashboard.js
export default function Dashboard() {
  return (
    <div style={{ maxWidth: 640 }}>
      <h2>대시보드</h2>
      <p style={{ marginTop: "0.75rem", color: "#555" }}>
        사용자의 스토리지 사용량, 온체인 청구 내역, 업로드한 파일
        요약을 보여주는 영역입니다.
      </p>

      <section
        style={{
          marginTop: "1.5rem",
          padding: "1rem 1.25rem",
          borderRadius: "0.75rem",
          border: "1px solid #eee",
          background: "#fafafa",
          fontSize: "0.9rem",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1rem" }}>TODO</h3>
        <ul style={{ marginTop: "0.5rem", paddingLeft: "1.2rem" }}>
          <li>현재 월 사용량(GB) + 예측 청구 금액 표시</li>
          <li>온체인에 커밋된 UsageSnapshot 이력 표시</li>
          <li>최근 업로드된 이미지 썸네일 / pHash 요약</li>
        </ul>
      </section>
    </div>
  );
}