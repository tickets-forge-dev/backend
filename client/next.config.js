/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/shared-types'],
  experimental: {
    turbo: {},
  },
};

module.exports = nextConfig;
