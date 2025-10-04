
import path from "path";
import { fileURLToPath } from "url";
import withBundleAnalyzer from "@next/bundle-analyzer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure bundle analyzer (enabled with ANALYZE=true)
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
});

/**
 * Production-ready Next.js config
 * - Optimized for faster builds
 * - Keeps type-checking separate (use `npm run type-check` in CI/dev)
 * - Enables caching and minimal experimental flags
 */
const nextConfig = {
  reactStrictMode: false,
  distDir: ".next",
  poweredByHeader: false,

  // Render.com static / Docker standalone build support
  output: "standalone",

  // Image optimization
  images: {
    domains: ["localhost"],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    minimumCacheTTL: 600,
  },

  // Build configuration
  eslint: {
    ignoreDuringBuilds: true, // run lint separately in CI
  },

  typescript: {
    ignoreBuildErrors: true, // build won’t block; run `npm run type-check` separately
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  compress: true,

  // Environment variables (safe for build-time injection)
  env: {
    DISABLE_STATIC_SLUG: process.env.DISABLE_STATIC_SLUG || "no-static",
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_BASIC_PRICE_ID: process.env.STRIPE_BASIC_PRICE_ID,
    STRIPE_PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID,
    STRIPE_ULTIMATE_PRICE_ID: process.env.STRIPE_ULTIMATE_PRICE_ID,
  },

  // URL rewrites
  async rewrites() {
    return [
      { source: "/sitemap.xml", destination: "/api/sitemap" },
      { source: "/rss.xml", destination: "/api/rss" },
    ];
  },

  // Modular imports optimization (tree-shaking)
  modularizeImports: {
    lodash: {
      transform: "lodash/{{member}}",
    },
  },

  // Minimal experimental features (avoid slowing builds)
  experimental: {
    // optimizeCss: false, // off by default
    // serverSourceMaps: true, // disable for faster builds
    optimizePackageImports: [
      "lucide-react", 
      "recharts", 
      "@radix-ui/react-icons",
      "framer-motion", // CRITICAL: Tree-shake framer-motion (major bundle size savings)
      "date-fns",
      "lodash"
    ],
    // Incremental compilation for faster rebuilds
    incrementalCacheHandlerPath: undefined,
    // Turbopack for faster dev compilation (Next.js 13+)
    // Enable if using Next.js 14+: turbo: {},
  },

  // Webpack config
  webpack: (config, { dev, isServer }) => {
    // ⚡ CRITICAL: Enable aggressive caching in dev mode
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [fileURLToPath(import.meta.url)],
        },
      };
      
      // Optimize module resolution
      config.snapshot = {
        managedPaths: [path.resolve(__dirname, 'node_modules')],
      };
    }

    // Optimize client dev build
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: "named",
        chunkIds: "named",
        runtimeChunk: "single",
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false, // Disable in dev for faster compilation
        // Prevent duplicate module compilation
        concatenateModules: true,
        // NOTE: usedExports removed - conflicts with Next.js cacheUnaffected
        // Tree-shaking still works via optimizePackageImports in experimental
      };
    }

    // Production optimizations
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

    // Alias for js-tiktoken (used by @langchain)
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "js-tiktoken/lite": path.resolve(
        __dirname,
        "src/shims/js-tiktoken-shim.cjs"
      ),
      // Provide a small shim for the next-flight loader used by some Next internals
      // This avoids "Can't resolve 'next-flight-client-entry-loader'" on some setups
      // and is a safe no-op when RSC flight entry behavior is not required in this app.
      "next-flight-client-entry-loader": path.resolve(__dirname, "src/shims/next-flight-client-entry-loader.cjs"),
    };

    return config;
  },
};

export default bundleAnalyzer(nextConfig);

