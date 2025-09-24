import type { NextConfig } from "next";

// Get backend URL from environment variable, fallback to localhost for development
const BACKEND_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "w3-ui-unified-profile-proxy.w3-ui.dal.app.cirrus.ibm.com",
      },
      {
        protocol: "https",
        hostname: "avatars.github.ibm.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/github-chat",
        destination: "/github-assistant/github-chat",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // Proxy specific backend routes to FastAPI
      {
        source: "/api/github/fastapi/:path*",
        destination: `${BACKEND_URL}/api/github/fastapi/:path*`,
      },
      {
        source: "/api/requirement-analyzer/:path*",
        destination: `${BACKEND_URL}/api/requirement-analyzer/:path*`,
      },
      {
        source: "/api/vote/:path*",
        destination: `${BACKEND_URL}/api/vote/:path*`,
      },
      {
        source: "/api/share/:path*",
        destination: `${BACKEND_URL}/api/share/:path*`,
      },
      {
        source: "/api/organization/:path*",
        destination: `${BACKEND_URL}/api/organization/:path*`,
      },
      {
        source: "/api/health",
        destination: `${BACKEND_URL}/api/health`,
      },
      // Salesforce API routes
      {
        source: "/api/salesforce/:path*",
        destination: `${BACKEND_URL}/api/salesforce/:path*`,
      },
      // Catch-all for any other backend API routes not handled by Next.js
      {
        source: "/api/backend/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve these modules on the client to prevent errors
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        "fs/promises": false,
        "timers/promises": false,
        // Added optional mongodb dependencies
        kerberos: false,
        "@mongodb-js/zstd": false,
        "@aws-sdk/credential-providers": false,
        "gcp-metadata": false,
        snappy: false,
        socks: false,
        aws4: false,
        "mongodb-client-encryption": false,
      };
    }
    return config;
  },
};

export default nextConfig;
