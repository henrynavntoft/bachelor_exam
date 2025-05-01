import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        hostname: 'picsum.photos',
      },
      {
        hostname: 'mg-storage.eu-central-1.linodeobjects.com',
      },
    ],
  },
};

export default nextConfig;
