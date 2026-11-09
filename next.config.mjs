/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://app.italostudy.com https://italostudy.com http://localhost:5173 http://localhost:3000 https://*.italostudy.com",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
