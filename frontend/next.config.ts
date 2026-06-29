import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: ["react-markdown", "remark-gfm", "rehype-raw"],
};

export default nextConfig;
