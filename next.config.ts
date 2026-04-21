import type { NextConfig } from "next";

const normalizedBasePath = (() => {
  const value = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
  if (!value || value === "/") {
    return "";
  }

  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.replace(/\/+$/, "");
})();

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: normalizedBasePath || undefined,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
    APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY || "replace-with-a-long-random-secret-at-least-32-chars",
    NEXT_PUBLIC_BASE_PATH: normalizedBasePath
  }
};

export default nextConfig;
