/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/shared-types'],
  turbopack: {
    root: '../',
  },
  // COEP/COOP headers scoped to /preview only — required for WebContainer SharedArrayBuffer
  async headers() {
    return [
      {
        source: '/preview',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
