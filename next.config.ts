import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    DISABLE_STATIC_SLUG: process.env.DISABLE_STATIC_SLUG || 'no-static',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    deviceSizes: [320, 420, 768, 1024, 1200], // Customize based on responsive needs
    imageSizes: [16, 32, 48, 64, 96], // Common icon sizes
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },

  compress: true, // Ensures Gzip compression for faster performance
  output: 'standalone', // Optimizes build for container environments

};

export default nextConfig;