import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/dashboard/explore", "/dashboard/quizzes", "/contactus", "/privacy", "/terms"],
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/profile",
          "/dashboard/subscription",
          "/dashboard/create",
          "/*.json$",
          "/user/*",
          "/auth",
        ],
        crawlDelay: 2,
      },
      {
        // Special rules for major search engines to ensure optimal crawling
        userAgent: ["Googlebot", "Bingbot"],
        allow: ["/", "/dashboard/explore", "/dashboard/quizzes", "/contactus", "/privacy", "/terms"],
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/profile",
          "/dashboard/subscription",
          "/dashboard/create",
          "/*.json$",
          "/user/*",
          "/auth",
        ],
      },
    ],
    // Multiple sitemaps for different sections of the site
    sitemap: [`${baseUrl}/sitemap.xml`],
    // Specify the canonical host
    host: baseUrl,
  }
}

