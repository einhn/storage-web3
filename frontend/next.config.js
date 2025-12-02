/** @type {import('next').NextConfig} */

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_ORIGIN;

const nextConfig = {
  async rewrites() {
    return [
      {
        // 브라우저/프론트 입장에서는 /api/... 로만 호출
        source: "/api/:path*",
        // 실제로는 백엔드(ngrok or localhost)로 프록시
        destination: `${BACKEND_ORIGIN}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;