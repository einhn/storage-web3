// frontend/src/pages/api/files/list.js
export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  try {
    const upstream = await fetch(
      `${backendBase}/files/user/${encodeURIComponent(userId)}`
    );

    const text = await upstream.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // 백엔드에서 HTML 에러를 돌려줄 수도 있으니 대비
      data = { raw: text };
    }

    res.status(upstream.status).json(data);
  } catch (err) {
    console.error("[/api/files/list] error:", err);
    res.status(500).json({ error: "failed to fetch from backend" });
  }
}