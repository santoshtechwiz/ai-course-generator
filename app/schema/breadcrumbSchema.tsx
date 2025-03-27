// Enhanced breadcrumb schema with all your requested URLs
export const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pricing",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"}/pricing`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Dashboard",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"}/dashboard`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Subscription",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"}/dashboard/subscription`,
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "Explore",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"}/dashboard/explore`,
      },
      {
        "@type": "ListItem",
        position: 6,
        name: "About Us",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"}/about-us`,
      },
      {
        "@type": "ListItem",
        position: 7,
        name: "Contact Us",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"}/contactus`,
      },
    ],
  }
  
  