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
      {
        protocol: "https",
        hostname: "img.youtube.com",
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

  // Webpack optimizations for faster builds
  webpack: (config, { dev, isServer }) => {
    // Optimize build performance
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }

    // Reduce bundle size in production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      }
    }

    return config
  },


  // Experimental features
  experimental: {
    optimizeCss: true, // Optimize CSS
    // Faster development builds
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-icons'],
  },
}

export default nextConfig