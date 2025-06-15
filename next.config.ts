import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // This setting disables ESLint checks during the `next build` process.
  // This is useful for preventing linting errors from blocking a production
  // deployment on platforms like Vercel, especially if you plan to
  // address linting issues separately.
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disabling experimental.nextScriptWorkers can resolve warnings with 
  // third-party scripts like AdSense, without affecting performance.
  experimental: {
    nextScriptWorkers: false,
  },
};

export default nextConfig;
