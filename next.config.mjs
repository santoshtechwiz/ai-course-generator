const nextConfig = {
  reactStrictMode: false,
  distDir: ".next",
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Modularize imports for smaller bundles 
  modularizeImports: {
    lodash: {
      transform: "lodash/{{member}}",
    },
    // Add more commonly used libraries
    "react-icons": {
      transform: "react-icons/{{member}}",
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
    // Add loader for better performance
    loader: 'default',
    // Optimize image quality vs size
    quality: 85,
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
  
  // Security headers
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
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

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
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
            priority: 5,
          },
          // Separate large libraries
          react: {
            name: 'react',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            priority: 20,
          },
        },
      }
    }

    // Optimize module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      // Reduce bundle size by using smaller variants
      '@': require('path').resolve(__dirname),
    }

    return config
  },

  // Experimental features
  experimental: {
    optimizeCss: true, // Optimize CSS
    // Faster development builds

    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-icons', 'framer-motion'],
    // Better performance
    scrollRestoration: true,
    // Better bundling
    bundlePagesRouterDependencies: true,

    serverSourceMaps: true,
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-icons'],

  },
}

export default nextConfig