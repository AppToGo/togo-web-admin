import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Enable trailing slashes for consistency
  trailingSlash: true,
};

export default nextConfig;
