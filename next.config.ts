import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Les photos compressées (~400 Ko max) transitent par les Server Actions.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
