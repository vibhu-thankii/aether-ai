import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // The 'experimental.nextScriptWorkers' flag is a known cause of the 
  // 'data-nscript' warning with third-party scripts like AdSense. 
  // Disabling it resolves the issue without affecting performance.
  experimental: {
    nextScriptWorkers: false,
  },
  
  // We are adding a custom Content Security Policy (CSP) to the headers.
  // This policy explicitly allows Google's ad services to be framed within 
  // your application, which is necessary for AdSense to function correctly.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://googleads.g.doubleclick.net https://*.google.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;