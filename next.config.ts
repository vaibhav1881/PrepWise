import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Increase body size limit for audio uploads
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
};

export default nextConfig;
