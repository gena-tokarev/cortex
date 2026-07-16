const { withNx } = require('@nx/next/plugins/with-nx');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = withNx(nextConfig);
