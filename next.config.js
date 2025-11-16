/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  experimental: {
    // Force Node.js runtime for API routes (better for AI APIs)
    serverComponentsExternalPackages: ['@deepseek/sdk'],
  },
  // Configure API routes for better performance
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
};

module.exports = nextConfig;
