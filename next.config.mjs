const nextConfig = {
  reactStrictMode: false,
  distDir: ".next",
  poweredByHeader: false, // Remove X-Powered-By header for security
 
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
    minimumCacheTTL: 60, // Cache images for at least 60 seconds
  },
  // Rewrites
  async rewrites() {
    return [
      {
        source: "/sitemap.xml",
        destination: "/api/sitemap",
      },
    ]
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: "/dashboard/create",
        destination: "/dashboard/course/create",
        permanent: true,
      },
      {
        source: "/dashboard/create/:path*",
        destination: "/dashboard/course/create/:path*",
        permanent: true,
      },
    ]
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

  // // Experimental features
  // experimental: {
  //   optimizeCss: true, // Optimize CSS
  //   optimizePackageImports: [],

  // },
}

export default nextConfig