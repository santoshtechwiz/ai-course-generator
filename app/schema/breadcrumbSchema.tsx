// Enhanced breadcrumb schema with all your requested URLs
export const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pricing",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"}/pricing`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Dashboard",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"}/dashboard`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Subscription",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"}/dashboard/subscription`,
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "Explore",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"}/dashboard/explore`,
      },
      {
        "@type": "ListItem",
        position: 6,
        name: "About Us",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"}/about-us`,
      },
      {
        "@type": "ListItem",
        position: 7,
        name: "Contact Us",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"}/contactus`,
      },
    ],
  }
  
  