import type { NextConfig } from "next";

// STABLE NEXT.JS CONFIGURATION - TESTED AND VERIFIED
const nextConfig: NextConfig = {
  // SIMPLE, STABLE CONFIGURATION
  serverExternalPackages: ['@prisma/client'],
  
  // EXPERIMENTAL FEATURES DISABLED FOR STABILITY
  experimental: {
    // Disable experimental features that might cause issues
  },
  
  // WEBPACK CONFIGURATION REMOVED - USING DEFAULT
  // Turbopack handles most optimizations automatically
  
  // ENVIRONMENT CONFIGURATION
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // SECURITY HEADERS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

export default nextConfig

