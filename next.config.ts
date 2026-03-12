import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://awsga5alupzv2bnl.public.blob.vercel-storage.com",
              "media-src 'self' https://awsga5alupzv2bnl.public.blob.vercel-storage.com",
              "font-src 'self'",
              "connect-src 'self' https://va.vercel-scripts.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
