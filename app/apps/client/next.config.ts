import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,  // Ignore linting during builds
  },
};

export default nextConfig;
