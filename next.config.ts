import type { NextConfig } from "next";

const production = process.env.NODE_ENV === "production";
const apiOrigin = origin(process.env.NEXT_PUBLIC_API_BASE_URL);
const contentSecurityPolicy = production
  ? `default-src 'self'; base-uri 'self'; connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}; font-src 'self' https://cdn.fontshare.com; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://api.fontshare.com; upgrade-insecure-requests`
  : "base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

const nextConfig: NextConfig = {
  output: "standalone",
  // Keep local browser testing usable without admitting arbitrary dev origins.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
      ],
    }];
  },
};

function origin(value: string | undefined): string {
  if (!value) return "";
  try { const parsed = new URL(value); return parsed.protocol === "https:" || ["localhost", "127.0.0.1"].includes(parsed.hostname) ? parsed.origin : ""; }
  catch { return ""; }
}

export default nextConfig;
