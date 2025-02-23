import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/sitemap.xml",
        ],
        disallow: ["/api/", "/admin/", "/private/", "/*.json$", "/user/*", "/auth"],
        crawlDelay: 2,
      },
      {
        // Special rules for major search engines to ensure optimal crawling
        userAgent: ["Googlebot", "Bingbot"],
        allow: "/",
        disallow: ["/api/", "/admin/",  "/private/", "/*.json$", "/user/*","/auth"],
      },
    ],
    // Multiple sitemaps for different sections of the site
    sitemap: [
      "https://courseai.dev/sitemap.xml",
    ],
    // Specify the canonical host
    host: "https://courseai.dev",
  }
}


