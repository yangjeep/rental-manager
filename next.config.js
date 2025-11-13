/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages adapter (@cloudflare/next-on-pages) will handle the build
  // No output: 'export' needed - the adapter handles edge runtime
  images: {
    unoptimized: true, // Cloudflare Pages handles image optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;

