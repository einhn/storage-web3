// frontend/src/pages/dashboard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [wallet, setWallet] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    const { userId, wallet } = router.query;

    if (userId && wallet) {
      setUserId(userId);
      setWallet(wallet);

      // 데모
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "storage-web3:user",
          JSON.stringify({ userId, wallet })
        );
      }
    } else {
      // 쿼리 없으면 기존 저장값 복구
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("storage-web3:user");
        if (raw) {
          try {
            const saved = JSON.parse(raw);
            setUserId(saved.userId);
            setWallet(saved.wallet);
          } catch {}
        }
      }
    }
  }, [router.isReady, router.query]);

  return (
    <div>
      <h2>대시보드</h2>
      {wallet ? (
        <p>
          연결된 지갑: <code>{wallet}</code>
        </p>
      ) : (
        <p>지갑 정보를 불러오는 중...</p>
      )}
      {/* 업로드 페이지 링크 */}
      <p style={{ marginTop: "1rem" }}>
        <a href="/upload">이미지 업로드 하러 가기</a>
      </p>
    </div>
  );
}