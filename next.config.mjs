const nextConfig = {
  reactStrictMode: false,
  distDir: ".next",
  poweredByHeader: false, // Remove X-Powered-By header for security
  experimental: {
    missingSuspenseWithCSRBailout: false,
    optimizeCss: true, // Enable CSS optimization
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@heroicons/react',
      'lucide-react',
      'react-icons'
    ],
    turbo: {
      resolveAlias: {
        // Add common aliases here
        '@': '.',
        '@components': './components',
      }
    },
    serverActions: true,
    typedRoutes: true,
    mdxRs: true,
    webpackBuildWorker: true,
  },
  // Optimize image loading
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

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    styledComponents: true,
  },

  headers: async () => [
    {
      source: '/:all*(svg|jpg|png|webp|avif)',
      locale: false,
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        }
      ],
    },
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
      ],
    },
  ],

  transpilePackages: [
    '@radix-ui',
    '@hookform',
    'lucide-react',
    'react-hook-form'
  ],

  // // Experimental features
  // experimental: {
  //   optimizeCss: true, // Optimize CSS
  //   optimizePackageImports: [],

  // },
}

export default nextConfig
