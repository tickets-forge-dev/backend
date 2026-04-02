/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/shared-types'],
  turbopack: {
    root: '../',
  },
};

module.exports = nextConfig;
