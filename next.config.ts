import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep local browser testing usable without admitting arbitrary dev origins.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
};

export default nextConfig;
