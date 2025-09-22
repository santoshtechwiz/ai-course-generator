const nextConfig = {
  reactStrictMode: false,
  distDir: ".next",
  poweredByHeader: false,

  // CSS configuration
  images: {
    domains: ['localhost'],
  },
  
  // Development configuration
  typescript: {
    ignoreBuildErrors: true, // For development only
  },

  compiler: {
    // Enabled by default in development, disabled in production to reduce file size
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    // Enable App Router features
    appDir: true,
    // Configure dynamic routes
    dynamicRoutes: {
      // Use routing.json for dynamic route config
      config: './app/routing.json'
    },
    // Ensure SWC is properly configured
    swcPlugins: []
  },

  // Basic webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Apply optimizations for client-side development
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        chunkIds: 'named',
        runtimeChunk: 'single',
        splitChunks: {
          cacheGroups: {
            styles: {
              name: 'styles',
              type: 'css/mini-extract',
              chunks: 'all',
              enforce: true,
            },
          },
        },
      }
    }
        // Provide alias for js-tiktoken lite to satisfy named imports used by @langchain
        config.resolve = config.resolve || {};
        config.resolve.alias = {
          ...(config.resolve.alias || {}),
          'js-tiktoken/lite': require('path').resolve(__dirname, 'src/shims/js-tiktoken-shim.cjs'),
        };

        return config
  },

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
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    minimumCacheTTL: 600,
  },

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

  env: {
    DISABLE_STATIC_SLUG: process.env.DISABLE_STATIC_SLUG || "no-static",
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    // Price ID mappings for secure Stripe integration
    STRIPE_BASIC_PRICE_ID: process.env.STRIPE_BASIC_PRICE_ID,
    STRIPE_PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID,
    STRIPE_ULTIMATE_PRICE_ID: process.env.STRIPE_ULTIMATE_PRICE_ID,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  compress: true,
  turbopack: {
     resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }

    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            enforce: true,
          },
        },
      };
    }

    return config;
  },

  experimental: {
    optimizeCss: false,
    serverSourceMaps: true,
    optimizePackageImports: ["lucide-react", "recharts", "@radix-ui/react-icons"],
  },
};

export default nextConfig;