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
        destination: 'http://localhost:8279/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig;
