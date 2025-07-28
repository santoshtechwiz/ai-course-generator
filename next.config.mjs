const nextConfig = {
  reactStrictMode: false,
  distDir: ".next",
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Modularize imports for smaller bundles (example for lodash)
  modularizeImports: {
    lodash: {
      transform: "lodash/{{member}}",
    },
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    minimumCacheTTL: 600, // Cache images for at least 10 minutes
    dangerouslyAllowSVG: false,
  },
  // Rewrites
  async rewrites() {
    return [
      {
        source: "/sitemap.xml",
        destination: "/api/sitemap",
      },
      {
        source: "/rss.xml",
        destination: "/api/rss",
      },
    ];
  },
  
  

  // Environment variables
  env: {
    DISABLE_STATIC_SLUG: process.env.DISABLE_STATIC_SLUG || "no-static",
  },

  // Build optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Performance optimizations
  compress: true,


  // Experimental features
  experimental: {
    optimizeCss: true, // Optimize CSS
    // Add more experimental flags as needed, see Next.js docs for valid options
  },
}

export default nextConfig