import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // `standalone` exists for the Docker image — the Dockerfile copies the
  // standalone output. It must NOT be set on Vercel: Vercel does its own
  // output tracing, and its `onBuildComplete` step then fails looking for a
  // `next-server.js.nft.json` trace file that standalone mode never emits.
  // Vercel sets VERCEL=1 during the build.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
};

export default withNextIntl(nextConfig);
