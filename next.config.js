/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { 
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif']
  },
  experimental: {
    serverComponentsExternalPackages: ['@deepseek/sdk'],
  },
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
