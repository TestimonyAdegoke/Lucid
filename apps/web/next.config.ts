import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tardemah/database", "@tardemah/domain"],
};

export default nextConfig;
