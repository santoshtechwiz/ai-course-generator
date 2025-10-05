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
    minimumCacheTTL: 60, // Reduced from 600 to prevent caching invalid images too long
    // Handle invalid images gracefully
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
    // Custom loader for better error handling
    loader: 'default',
  },

  // Keep lint & type checks in CI (faster local builds)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }, // run `npm run type-check` in CI

  // Compiler transforms (strip console in production)
  compiler: { removeConsole: process.env.NODE_ENV === "production" },

  compress: true,

  // Performance optimizations
  swcMinify: true,
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  // Additional performance flags
  generateEtags: false, // Disable etags for better performance
  poweredByHeader: false, // Already set above but ensuring it's applied

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
    "@radix-ui/react-icons": {
      transform: "@radix-ui/react-icons/dist/{{member}}",
    },
    "date-fns": {
      transform: "date-fns/{{member}}",
    },
  },

  // Experimental flags (minimal & consolidated)
  experimental: {
    optimizePackageImports: [
      "recharts",
      "@radix-ui/react-icons",
      "date-fns",
      "lodash",
      "@react-pdf/renderer",
      "@langchain/openai",
      "@langchain/core",
      "@langchain/community",
      "youtubei.js",
      "@monaco-editor/react",
      "@ai-sdk/openai",
      "@ai-sdk/react",
      "@google/generative-ai",
      "react-player",
      "react-syntax-highlighter",
      "marked",
      "prismjs",
      "highlight.js",
    ],
    // Enable turbopack/incremental compilation only when you're ready
    // turbo: {},
  },

  // Webpack customizations for dev & prod (only when not using Turbopack)
  ...(process.env.TURBOPACK || nextConfig.experimental?.turbo ? {} : {
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
            moduleIds: "deterministic",
            chunkIds: "deterministic",
            runtimeChunk: "single",
            removeAvailableModules: false,
            removeEmptyChunks: false,
            splitChunks: false, // faster dev compilation
            concatenateModules: true,
            emitOnErrors: false, // Don't emit assets on errors for faster rebuilds
          }
        }

        // Add performance hints for dev
        config.performance = {
          hints: false, // Disable performance hints in dev
        }
      }

      // Production split-chunk optimizations for smaller client bundles
      if (!dev && !isServer) {
        config.optimization = config.optimization || {}
        config.optimization.splitChunks = {
          chunks: "all",
          maxInitialRequests: 25,
          minSize: 20000,
          maxSize: 500000, // Limit chunk size for better caching
          cacheGroups: {
            // React core libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: "react-vendor",
              priority: 40,
              reuseExistingChunk: true,
            },
            // Framer Motion - large animation library
            framerMotion: {
              test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
              name: "framer-motion",
              priority: 35,
              reuseExistingChunk: true,
            },
            // UI libraries
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|cmdk)[\\/]/,
              name: "ui-vendor",
              priority: 30,
              reuseExistingChunk: true,
            },
            // Icons
            icons: {
              test: /[\\/]node_modules[\\/](lucide-react|@radix-ui\/react-icons)[\\/]/,
              name: "icons",
              priority: 25,
              reuseExistingChunk: true,
            },
            // Charts (heavy)
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
              name: "charts",
              priority: 30,
              reuseExistingChunk: true,
            },
            // Heavy utilities
            utilities: {
              test: /[\\/]node_modules[\\/](date-fns|lodash|axios)[\\/]/,
              name: "utilities",
              priority: 20,
              reuseExistingChunk: true,
            },
            // Remaining node_modules
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              priority: 10,
              reuseExistingChunk: true,
            },
            // Common chunks used across multiple pages
            commons: {
              name: "commons",
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        }
        
        // Minimize bundle size
        config.optimization.minimize = true
        config.optimization.usedExports = true
        config.optimization.sideEffects = true
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

      // Additional performance optimizations
      if (!dev) {
        config.optimization.minimizer = config.optimization.minimizer || []
        // Ensure Terser is configured for maximum compression
        config.optimization.minimize = true
      }

      return config
    }
  }),
}

export default bundleAnalyzer(nextConfig)
