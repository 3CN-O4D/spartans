/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

const r2PublicHost = process.env.R2_PUBLIC_URL
  ? new URL(process.env.R2_PUBLIC_URL).host
  : "";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js injects inline bootstrap scripts; dev additionally needs eval.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      r2PublicHost
        ? `media-src 'self' blob: https://${r2PublicHost}`
        : "media-src 'self' blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://vercel.com" +
        (r2PublicHost ? ` https://${r2PublicHost}` : "") +
        (isDev ? " ws: wss:" : ""),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
