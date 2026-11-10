/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: ["127.0.0.1", "localhost", "0.0.0.0"],
  async redirects() {
    return [
      {
        source: '/Doubtster',
        destination: '/app',
        permanent: false,
      },
      {
        source: '/doubtster',
        destination: '/app',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
