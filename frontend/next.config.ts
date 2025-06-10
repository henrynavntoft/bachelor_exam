import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false, // Hide X-Powered-By header
  images: {
    remotePatterns: [
      {
        hostname: 'fastly.picsum.photos',
      },
      {
        hostname: 'mg-storage.eu-central-1.linodeobjects.com',
      },
      {
        hostname: 'robohash.org',
      },
    ],
  },
};

export default nextConfig;
