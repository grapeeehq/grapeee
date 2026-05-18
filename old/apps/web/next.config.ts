import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@grapeee/agent-core",
    "@grapeee/shared-types",
  ],
};

export default nextConfig;
