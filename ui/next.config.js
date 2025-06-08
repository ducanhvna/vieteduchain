/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/nodeinfo',
        destination: 'http://localhost:8279/nodeinfo',
      },
      {
        source: '/api/:path*',
        destination: 'http://api:8000/api/:path*', // Sử dụng tên service Docker Compose
      },
    ];
  },
}

module.exports = nextConfig;
