import type { NextConfig } from "next";

function getR2RemotePattern() {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (!baseUrl) return null;

  try {
    const parsed = new URL(baseUrl);
    const normalizedPath = parsed.pathname.replace(/\/$/, "");
    const pathname = normalizedPath ? `${normalizedPath}/**` : "/**";

    return {
      protocol: parsed.protocol.replace(":", "") as "http" | "https",
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      pathname,
    };
  } catch {
    return null;
  }
}

const r2RemotePattern = getR2RemotePattern();

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    remotePatterns: r2RemotePattern ? [r2RemotePattern] : [],
  },
};

export default nextConfig;
