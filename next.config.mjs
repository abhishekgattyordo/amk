/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/inventory/:category/:id/history',
        destination: '/',
      },
      {
        source: '/history/:entity/:id',
        destination: '/',
      }
    ];
  },
};

export default nextConfig;
