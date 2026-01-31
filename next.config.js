/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  swcMinify: true,
  modularizeImports: {
    "@/components/ui": {
      transform: "use~/components/ui/{{member}}",
      skipDefault: true,
    },
  },
  images: {
    // Security: Explicitly allow only specific domains
    // Do NOT use "**" - it allows any domain and creates DoS vulnerability
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.vercel.app",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128],
    minimumCacheTTL: 31536000,
  },
  headers: async () => {
    return [
      {
        source: "/:all*(svg|jpg|png|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
