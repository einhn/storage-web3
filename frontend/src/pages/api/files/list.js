// frontend/src/pages/api/files/list.js
export default async function handler(req, res) {
  const { userId } = req.query;
  console.log("[/api/files/list] userId =", userId);

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_ORIGIN;
  console.log("[/api/files/list] backendBase =", backendBase);

  try {
    const upstream = await fetch(
      `${backendBase}/files/user/${encodeURIComponent(userId)}`
    );
    console.log(
      "[/api/files/list] upstream status =",
      upstream.status
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