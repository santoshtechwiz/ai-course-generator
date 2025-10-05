// next.config.mjs (ESM) or next.config.js if your package.json has "type": "module"
import path from "path"
import { fileURLToPath } from "url"
import bundleAnalyzerPkg from "@next/bundle-analyzer"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Initialize bundle analyzer wrapper
const withBundleAnalyzer = bundleAnalyzerPkg.default
  ? bundleAnalyzerPkg.default
  : bundleAnalyzerPkg
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
})

/**
 * Production-ready Next.js config
 * - Optimized for faster builds & smaller bundles
 * - Keep type-checking & linting separate in CI
 * - Minimal, safe experimental flags
 */
const nextConfig = {
  reactStrictMode: true,
  distDir: ".next",
  poweredByHeader: false,
  output: "standalone",

  // Image optimization
  images: {
    domains: [
      "localhost",
      "img.clerk.com",
      "placehold.co",
      "avatars.githubusercontent.com",
      "img.youtube.com",
      "images.unsplash.com",
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 600,
  },

  // Keep lint & type checks in CI (faster local builds)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }, // run `npm run type-check` in CI

  // Compiler transforms (strip console in production)
  compiler: { removeConsole: process.env.NODE_ENV === "production" },

  compress: true,

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

  async rewrites() {
    return [
      { source: "/sitemap.xml", destination: "/api/sitemap" },
      { source: "/rss.xml", destination: "/api/rss" },
    ]
  },

  // Modular imports optimization (tree-shaking helpers)
  modularizeImports: {
    lodash: { transform: "lodash/{{member}}" },
  },

  // Experimental flags (minimal & consolidated)
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@radix-ui/react-icons",
      "framer-motion",
      "date-fns",
      "lodash",
      "@react-pdf/renderer",
      "@langchain/openai",
      "@langchain/core",
      "@langchain/community",
      "youtubei.js",
      "@monaco-editor/react",
    ],
    // Enable turbopack/incremental compilation only when you're ready
    // turbo: {},
  },

  // Webpack customizations for dev & prod
  webpack: (config, { dev, isServer }) => {
    // Aggressive filesystem caching in dev for faster rebuilds
    if (dev) {
      config.cache = {
        type: "filesystem",
        buildDependencies: {
          config: [fileURLToPath(import.meta.url)],
        },
      }

      // Speed up module resolution in dev
      config.snapshot = {
        managedPaths: [path.resolve(__dirname, "node_modules")],
      }

      // Dev build opts to favor faster iteration over maximal optimization
      if (!isServer) {
        config.optimization = {
          ...config.optimization,
          moduleIds: "named",
          chunkIds: "named",
          runtimeChunk: "single",
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: false, // faster dev compilation
          concatenateModules: true,
        }
      }
    }

    // Production split-chunk optimizations for smaller client bundles
    if (!dev && !isServer) {
      config.optimization = config.optimization || {}
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
          },
          commons: {
            name: "commons",
            minChunks: 2,
            chunks: "all",
            enforce: true,
            priority: 5,
          },
        },
      }
    }

    // Helpful aliases / shims
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "js-tiktoken/lite": path.resolve(
        __dirname,
        "src/shims/js-tiktoken-shim.cjs"
      ),
      "next-flight-client-entry-loader": path.resolve(
        __dirname,
        "src/shims/next-flight-client-entry-loader.cjs"
      ),
    }

    return config
  },
}

export default bundleAnalyzer(nextConfig)
