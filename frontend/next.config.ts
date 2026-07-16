import type { NextConfig } from "next";

// Dev proxy: when BACKEND_ORIGIN is set, requests to /backend/* are proxied to
// the real backend server-side. This makes the browser see all API calls as
// same-origin (localhost:3000), so the backend's SameSite=Lax auth cookies work
// without CORS or backend changes. Point NEXT_PUBLIC_API_URL at "/backend".
const backendOrigin = process.env.BACKEND_ORIGIN?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    if (!backendOrigin) return [];
    return [{ source: "/backend/:path*", destination: `${backendOrigin}/:path*` }];
  },
};

export default nextConfig;
