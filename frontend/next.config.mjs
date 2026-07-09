/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose DEV_MODE to the edge runtime (proxy.ts).
  // NEXT_PUBLIC_ vars are inlined at BUILD TIME only — not available in edge/middleware at runtime.
  // next.config env{} values ARE available in edge runtime via process.env.
  env: {
    DEV_MODE: process.env.NEXT_PUBLIC_DEV_MODE ?? "false",
  },
};

export default nextConfig;
