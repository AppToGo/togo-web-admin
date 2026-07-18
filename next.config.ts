import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Production public bucket + local MinIO in dev
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.togoapp.co",
      },
      ...(process.env.NODE_ENV !== "production"
        ? [
            {
              protocol: "http" as const,
              hostname: "localhost",
            },
          ]
        : []),
    ],
  },
  // Enable trailing slashes for consistency
  trailingSlash: true,
};

export default withNextIntl(nextConfig);
