const isDevelopment = process.env.NODE_ENV === "development";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=()"
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["YOUR_SUPABASE_PROJECT_ID.supabase.co"]
  },
  ...(isDevelopment
    ? {}
    : {}),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
