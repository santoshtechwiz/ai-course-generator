"use client"

import { usePathname } from "next/navigation"

// Define types for the schema generators
type QuizSchemaParams = {
  name: string
  description: string
  url: string
  numberOfQuestions: number
  timeRequired: string
  educationalLevel?: string
}

type CourseSchemaParams = {
  name: string
  description: string
  provider: string
  url: string
  imageUrl?: string
  instructorName?: string
  instructorUrl?: string
  dateCreated: string
  dateModified?: string
}

type BreadcrumbItem = {
  name: string
  url: string
}

// Schema generator functions
function generateQuizSchema(params: QuizSchemaParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: params.name,
    description: params.description,
    url: params.url,
    educationalAlignment: {
      "@type": "AlignmentObject",
      educationalFramework: "Programming Skills",
      targetName: "Coding Knowledge Assessment",
      alignmentType: "assesses",
      educationalLevel: params.educationalLevel || "Beginner",
    },
    timeRequired: params.timeRequired,
    numberOfQuestions: params.numberOfQuestions,
    isAccessibleForFree: true,
    provider: {
      "@type": "Organization",
      name: "CourseAI",
      url: new URL("/", params.url).toString(),
    },
    keywords:
      "free quiz, programming assessment, coding test, free coding quiz, beginner programming, learn to code, practice coding, interactive quiz",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": params.url,
    },
  }
}

function generateCourseSchema(params: CourseSchemaParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: params.name,
    description: params.description,
    provider: {
      "@type": "Organization",
      name: params.provider,
      url: new URL("/", params.url).toString(),
    },
    url: params.url,
    ...(params.imageUrl && { image: params.imageUrl }),
    inLanguage: "en",
    dateCreated: new Date(params.dateCreated).toISOString(),
    ...(params.dateModified && { dateModified: new Date(params.dateModified).toISOString() }),
    ...(params.instructorName && {
      instructor: {
        "@type": "Person",
        name: params.instructorName,
        ...(params.instructorUrl && { url: params.instructorUrl }),
      },
    }),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseWorkload: "P2D",
      courseMode: "online",
      provider: {
        "@type": "Organization",
        name: params.provider,
        url: new URL("/", params.url).toString(),
      },
      courseSchedule: {
        "@type": "Schedule",
        duration: "PT3H",
        repeatFrequency: "Daily",
        repeatCount: 31,
        startDate: "2024-07-01",
        endDate: "2024-07-31",
      },
    },
    audience: {
      "@type": "Audience",
      audienceType: "Programmers and coding enthusiasts",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      category: "free",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      validFrom: "2023-01-01",
      priceValidUntil: "2099-12-31",
    },
    keywords:
      "free programming course, learn to code free, free coding lessons, online programming course, free developer training, beginner coding course, free tech education",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": params.url,
    },
  }
}

function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

function generateFAQSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}

function generateOrganizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CourseAI",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo.png`,
      width: "180",
      height: "60",
    },
    sameAs: [
      "https://twitter.com/courseai",
      "https://facebook.com/courseai",
      "https://linkedin.com/company/courseai",
      "https://github.com/courseai",
      "https://youtube.com/courseai",
      "https://instagram.com/courseai.official",
      "https://pinterest.com/courseai",
    ].filter(Boolean),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+1-800-123-4567",
      contactType: "customer service",
      email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "webmaster.codeguru@gmail.com",
      availableLanguage: ["English", "Spanish", "French", "German"],
      contactOption: "TollFree",
    },
    slogan: "Free Programming Education For Everyone",
    description:
      "CourseAI provides 100% free programming education resources, coding tutorials, and interactive learning tools for students, professionals, and hobbyists worldwide.",
    foundingDate: "2020-01-01",
    numberOfEmployees: {
      "@type": "QuantitativeValue",
      value: "25",
    },
    award: "Best Free Educational Platform 2023",
  }
}

function generateWebsiteSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: baseUrl,
    name: "CourseAI - Free Programming Education Platform",
    alternateName: ["CourseAI Free Coding Resources", "CourseAI Programming Tutorials"],
    description:
      "An intelligent learning platform offering 100% free coding quizzes, programming courses, and AI-powered educational resources. Access free tutorials, coding exercises, and learning materials with no registration required.",
    keywords:
      "free coding quiz, free programming courses, free AI education, learn to code free, free coding resources, free programming tutorials, free tech education, free online learning, no-cost programming, free developer tools, free coding exercises, free programming lessons, free tech tutorials, free coding education, free developer resources",
    inLanguage: "en-US",
    copyrightYear: new Date().getFullYear(),
    potentialAction: [
      {
        "@type": "SearchAction",
        target: `${baseUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
      {
        "@type": "ReadAction",
        target: [
          `${baseUrl}/free-courses`,
          `${baseUrl}/free-quizzes`,
          `${baseUrl}/free-resources`,
          `${baseUrl}/free-tutorials`,
          `${baseUrl}/free-coding-exercises`,
          `${baseUrl}/free-programming-guides`,
        ],
      },
    ],
    publisher: {
      "@type": "Organization",
      name: "CourseAI",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
        width: "180",
        height: "60",
      },
    },
    hasPart: [
      {
        "@type": "WebPage",
        isPartOf: {
          "@id": baseUrl,
        },
        name: "Free Programming Courses",
        description:
          "Browse our collection of 100% free programming courses covering all major languages and frameworks.",
        url: `${baseUrl}/free-courses`,
      },
      {
        "@type": "WebPage",
        isPartOf: {
          "@id": baseUrl,
        },
        name: "Free Coding Quizzes",
        description: "Test your programming knowledge with our free interactive coding quizzes and assessments.",
        url: `${baseUrl}/free-quizzes`,
      },
      {
        "@type": "WebPage",
        isPartOf: {
          "@id": baseUrl,
        },
        name: "Free Programming Resources",
        description:
          "Access our comprehensive library of free programming resources, tutorials, and learning materials.",
        url: `${baseUrl}/free-resources`,
      },
    ],
  }
}

function generatePricingSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "CourseAI Learning Platform",
    description: "AI-powered platform for creating courses, quizzes, and educational content with a generous free tier",
    image: [
      `${baseUrl}/images/courseai-logo.png`,
      `${baseUrl}/images/courseai-dashboard.png`,
      `${baseUrl}/images/courseai-mobile.png`,
    ],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "0",
      highPrice: "49.99",
      offerCount: "3",
      offers: [
        {
          "@type": "Offer",
          name: "Free Forever Plan",
          price: "0",
          priceCurrency: "USD",
          description: "Unlimited access to all basic features with no time limits or trial periods",
          url: `${baseUrl}/pricing#free-forever`,
          availability: "https://schema.org/InStock",
          priceValidUntil: "2099-12-31",
          itemCondition: "https://schema.org/NewCondition",
        },
        {
          "@type": "Offer",
          name: "Basic Plan",
          price: "19.99",
          priceCurrency: "USD",
          description: "25 Hosted Courses plus advanced features",
          url: `${baseUrl}/pricing#basic`,
          availability: "https://schema.org/InStock",
          priceValidUntil: "2024-12-31",
          itemCondition: "https://schema.org/NewCondition",
        },
        {
          "@type": "Offer",
          name: "Premium Plan",
          price: "49.99",
          priceCurrency: "USD",
          description: "Unlimited courses and premium features",
          url: `${baseUrl}/pricing#premium`,
          availability: "https://schema.org/InStock",
          priceValidUntil: "2024-12-31",
          itemCondition: "https://schema.org/NewCondition",
        },
      ],
    },
    brand: {
      "@type": "Brand",
      name: "CourseAI",
    },
    review: [
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: {
          "@type": "Person",
          name: "David Chen",
        },
        reviewBody:
          "The free plan offers more features than most paid platforms. I've been using CourseAI for 6 months and haven't needed to upgrade.",
      },
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: {
          "@type": "Person",
          name: "Sarah Williams",
        },
        reviewBody:
          "I can't believe how much quality content is available completely free. CourseAI has revolutionized how I teach programming.",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "1876",
      bestRating: "5",
      worstRating: "1",
    },
  }
}

function generateWebApplicationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "CourseAI Quiz Generator",
    applicationCategory: "EducationalApplication",
    applicationSubCategory: "Learning Tool",
    operatingSystem: "Web, iOS, Android",
    description:
      "100% free AI-powered platform for creating quizzes, assessments, and educational content instantly. Access unlimited free resources, templates, and tools with no hidden fees. Our free forever plan includes all essential features for students, teachers, and self-learners.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      validFrom: "2023-01-01",
      priceValidUntil: "2099-12-31",
    },
    featureList: [
      "Free AI Quiz Generation",
      "Free Multiple Choice Questions",
      "Free True/False Questions",
      "Free Open-Ended Questions",
      "Free Video Quiz Creation",
      "Free PDF Quiz Generation",
      "Free Custom Templates",
      "Free Analytics Dashboard",
      "Free Automated Grading",
      "Free Question Bank",
      "Unlimited Free Educational Resources",
      "Free Programming Tutorials",
      "Free Code Challenges",
      "Free Learning Paths",
      "Free Community Forums",
      "Free Code Playground",
      "Free Project Templates",
      "Free Developer Tools",
      "Free API Access",
      "Free Mobile Access",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
      bestRating: "5",
      worstRating: "1",
      reviewCount: "875",
    },
    review: [
      {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: "Jane Smith",
        },
        datePublished: "2023-11-15",
        reviewBody:
          "CourseAI has transformed how I teach programming concepts to my students. The AI-generated quizzes save me hours of preparation time.",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
      },
      {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: "Mark Johnson",
        },
        datePublished: "2023-10-22",
        reviewBody:
          "The free resources available on CourseAI helped me learn JavaScript in just two months. Highly recommended for self-learners!",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
      },
      {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: "Sophia Rodriguez",
        },
        datePublished: "2023-12-05",
        reviewBody:
          "I can't believe all these features are available for free. The interactive coding exercises and instant feedback have accelerated my learning journey tremendously.",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
      },
      {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: "Alex Thompson",
        },
        datePublished: "2024-01-18",
        reviewBody:
          "As a teacher with limited resources, CourseAI's free platform has been a game-changer for my classroom. My students love the interactive quizzes and coding challenges.",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
      },
    ],
    provider: {
      "@type": "Organization",
      name: "CourseAI",
      url: baseUrl,
    },
    screenshot: [
      `${baseUrl}/images/courseai-screenshot.png`,
      `${baseUrl}/images/courseai-mobile-screenshot.png`,
      `${baseUrl}/images/courseai-dashboard-screenshot.png`,
      `${baseUrl}/images/courseai-quiz-creator-screenshot.png`,
      `${baseUrl}/images/courseai-resources-screenshot.png`,
    ],
    softwareVersion: "2.1",
    url: baseUrl,
    downloadUrl: `${baseUrl}/download`,
    installUrl: `${baseUrl}/install`,
    releaseNotes: `${baseUrl}/release-notes`,
    availableOnDevice: ["Desktop", "Tablet", "Mobile", "iOS", "Android"],
    permissions: "No special permissions required",
    countriesSupported: "Worldwide",
    contentRating: "Suitable for all ages",
    interactionCount: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: "15000",
    },
  }
}

function generateArticleSchema(params: {
  headline: string
  description: string
  url: string
  imageUrl: string
  datePublished: string
  dateModified?: string
  authorName: string
  authorUrl?: string
  publisherName: string
  publisherLogoUrl: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.headline,
    description: params.description,
    image: params.imageUrl,
    datePublished: new Date(params.datePublished).toISOString(),
    ...(params.dateModified && { dateModified: new Date(params.dateModified).toISOString() }),
    author: {
      "@type": "Person",
      name: params.authorName,
      ...(params.authorUrl && { url: params.authorUrl }),
    },
    publisher: {
      "@type": "Organization",
      name: params.publisherName,
      logo: {
        "@type": "ImageObject",
        url: params.publisherLogoUrl,
        width: "180",
        height: "60",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": params.url,
    },
    keywords:
      "free programming tutorial, coding guide, learn to code free, programming tips, developer resources, free tech education",
    isAccessibleForFree: true,
    articleSection: "Programming Tutorials",
    wordCount: "1500",
  }
}

function generateLocalBusinessSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "CourseAI",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo.png`,
      width: "180",
      height: "60",
    },
    image: [
      `${baseUrl}/images/courseai-office.png`,
      `${baseUrl}/images/courseai-team.png`,
      `${baseUrl}/images/courseai-workspace.png`,
    ],
    description:
      "Leading provider of free AI-powered educational tools and resources for programmers and educators worldwide.",
    slogan: "Free Programming Education For Everyone",
    priceRange: "$$",
    telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+1-800-123-4567",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "webmaster.codeguru@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Tech Avenue",
      addressLocality: "San Francisco",
      addressRegion: "CA",
      postalCode: "94107",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "37.7749",
      longitude: "-122.4194",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "17:00",
      },
    ],
    sameAs: [
      "https://twitter.com/courseai",
      "https://facebook.com/courseai",
      "https://linkedin.com/company/courseai",
      "https://github.com/courseai",
      "https://youtube.com/courseai",
      "https://instagram.com/courseai.official",
      "https://pinterest.com/courseai",
    ].filter(Boolean),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Free Educational Resources",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Free Programming Tutorials",
            description: "Comprehensive tutorials on all major programming languages and frameworks",
          },
          price: "0",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Free Interactive Quizzes",
            description: "Test your programming knowledge with our interactive quizzes",
          },
          price: "0",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Free Code Playground",
            description: "Practice coding in a browser-based interactive environment",
          },
          price: "0",
          priceCurrency: "USD",
        },
      ],
    },
  }
}

function generateHowToSchema(params: {
  name: string
  description: string
  url: string
  imageUrl: string
  totalTime: string
  steps: Array<{
    name: string
    text: string
    url?: string
    imageUrl?: string
  }>
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: params.name,
    description: params.description,
    image: params.imageUrl,
    totalTime: params.totalTime,
    supply: [
      {
        "@type": "HowToSupply",
        name: "Computer or mobile device",
      },
      {
        "@type": "HowToSupply",
        name: "Internet connection",
      },
    ],
    tool: [
      {
        "@type": "HowToTool",
        name: "Web browser",
      },
      {
        "@type": "HowToTool",
        name: "CourseAI free account (optional)",
      },
    ],
    step: params.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url }),
      ...(step.imageUrl && {
        image: {
          "@type": "ImageObject",
          url: step.imageUrl,
        },
      }),
    })),
    keywords:
      "free programming tutorial, step-by-step guide, coding instructions, free learning resource, programming how-to",
    isAccessibleForFree: true,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": params.url,
    },
  }
}

function generateFreeResourcesCollectionSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Free Programming Resources and Tutorials",
    description:
      "Access our complete collection of 100% free programming resources, coding tutorials, developer tools, and educational materials. No registration required, no credit card needed, completely free forever.",
    url: `${baseUrl}/free-resources`,
    isPartOf: {
      "@type": "WebSite",
      name: "CourseAI",
      url: baseUrl,
    },
    about: {
      "@type": "Thing",
      name: "Free Programming Education",
    },
    keywords:
      "free coding resources, free programming tutorials, free developer tools, no-cost learning, free coding exercises, free programming guides, free tech education, free online courses, free coding challenges, free programming materials",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      validFrom: "2023-01-01",
      priceValidUntil: "2099-12-31",
    },
    mainEntity: [
      {
        "@type": "CreativeWork",
        name: "Free JavaScript Tutorial Series",
        description: "Comprehensive JavaScript tutorial series for beginners to advanced developers",
        url: `${baseUrl}/free-resources/javascript`,
        isAccessibleForFree: true,
      },
      {
        "@type": "CreativeWork",
        name: "Python Programming Guide",
        description: "Complete Python programming guide with interactive examples and exercises",
        url: `${baseUrl}/free-resources/python`,
        isAccessibleForFree: true,
      },
      {
        "@type": "CreativeWork",
        name: "Web Development Fundamentals",
        description: "Learn HTML, CSS, and JavaScript with our free web development course",
        url: `${baseUrl}/free-resources/web-development`,
        isAccessibleForFree: true,
      },
      {
        "@type": "CreativeWork",
        name: "Data Structures and Algorithms",
        description: "Master essential computer science concepts with our free DSA tutorials",
        url: `${baseUrl}/free-resources/dsa`,
        isAccessibleForFree: true,
      },
    ],
  }
}

function generateSoftwareApplicationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CourseAI Mobile App",
    applicationCategory: "EducationalApplication",
    operatingSystem: "iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.7",
      ratingCount: "2500",
      reviewCount: "1850",
    },
    description:
      "Access all of CourseAI's free programming resources, tutorials, and interactive coding exercises on your mobile device. Learn to code anytime, anywhere with our free mobile app.",
    downloadUrl: [`${baseUrl}/download/ios`, `${baseUrl}/download/android`],
    screenshot: [
      `${baseUrl}/images/app-screenshot1.png`,
      `${baseUrl}/images/app-screenshot2.png`,
      `${baseUrl}/images/app-screenshot3.png`,
    ],
    featureList: [
      "Free offline access to tutorials",
      "Interactive coding exercises",
      "Progress tracking",
      "Free quiz generator",
      "Code playground",
      "Community forums",
    ],
    keywords:
      "free coding app, programming education app, learn to code mobile, free educational app, programming tutorials app",
    softwareVersion: "3.2.1",
    fileSize: "45MB",
    interactionCount: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/DownloadAction",
      userInteractionCount: "500000",
    },
  }
}

export function JsonLd() {
  const pathname = usePathname()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  // Default breadcrumb schema based on current path
  const pathSegments = pathname.split("/").filter(Boolean)
  const breadcrumbItems: BreadcrumbItem[] = [{ name: "Home", url: baseUrl }]

  // Build breadcrumb items based on path segments
  let currentPath = ""
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`
    const readableName = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    breadcrumbItems.push({
      name: readableName,
      url: `${baseUrl}${currentPath}`,
    })
  })

  // Determine if current page is a blog post
  const isBlogPost = pathname.startsWith("/blog/") && pathSegments.length > 1

  // Determine if current page is a resource page
  const isResourcePage = pathname.startsWith("/resources/") && pathSegments.length > 1

  // Determine if current page is a course page
  const isCoursePage = pathname.startsWith("/courses/") && pathSegments.length > 1

  // Determine if current page is a free resource page
  const isFreeResourcePage = pathname.startsWith("/free-") || pathname.includes("/free-")

  // Determine if current page is a mobile app page
  const isMobileAppPage = pathname === "/mobile-app" || pathname === "/download" || pathname.includes("/app")

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateOrganizationSchema(baseUrl)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateWebsiteSchema(baseUrl)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateLocalBusinessSchema(baseUrl)),
        }}
      />
      {pathname === "/pricing" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generatePricingSchema(baseUrl)),
          }}
        />
      )}
      {(pathname === "/" || pathname === "/home") && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateWebApplicationSchema(baseUrl)),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateFreeResourcesCollectionSchema(baseUrl)),
            }}
          />
        </>
      )}
      {isBlogPost && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateArticleSchema({
                headline: `CourseAI - ${breadcrumbItems[breadcrumbItems.length - 1].name}`,
                description:
                  "Learn programming concepts, techniques, and best practices with CourseAI's comprehensive guides and tutorials.",
                url: breadcrumbItems[breadcrumbItems.length - 1].url,
                imageUrl: `${baseUrl}/images/blog/${pathSegments[pathSegments.length - 1]}.jpg`,
                datePublished: "2023-01-01", // This should be dynamically populated from your CMS or data source
                dateModified: "2023-12-01", // This should be dynamically populated from your CMS or data source
                authorName: "CourseAI Team",
                authorUrl: `${baseUrl}/team`,
                publisherName: "CourseAI",
                publisherLogoUrl: `${baseUrl}/logo.png`,
              }),
            ),
          }}
        />
      )}
      {isResourcePage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateHowToSchema({
                name: `How to ${breadcrumbItems[breadcrumbItems.length - 1].name}`,
                description:
                  "Step-by-step guide to mastering programming concepts with CourseAI's free educational resources.",
                url: breadcrumbItems[breadcrumbItems.length - 1].url,
                imageUrl: `${baseUrl}/images/resources/${pathSegments[pathSegments.length - 1]}.jpg`,
                totalTime: "PT1H30M",
                steps: [
                  {
                    name: "Step 1: Understand the basics",
                    text: "Begin by understanding the fundamental concepts of the topic.",
                    url: `${breadcrumbItems[breadcrumbItems.length - 1].url}#basics`,
                    imageUrl: `${baseUrl}/images/resources/${pathSegments[pathSegments.length - 1]}-step1.jpg`,
                  },
                  {
                    name: "Step 2: Practice with examples",
                    text: "Work through the provided examples to reinforce your understanding.",
                    url: `${breadcrumbItems[breadcrumbItems.length - 1].url}#examples`,
                    imageUrl: `${baseUrl}/images/resources/${pathSegments[pathSegments.length - 1]}-step2.jpg`,
                  },
                  {
                    name: "Step 3: Complete the challenges",
                    text: "Test your knowledge by completing the interactive challenges.",
                    url: `${breadcrumbItems[breadcrumbItems.length - 1].url}#challenges`,
                    imageUrl: `${baseUrl}/images/resources/${pathSegments[pathSegments.length - 1]}-step3.jpg`,
                  },
                ],
              }),
            ),
          }}
        />
      )}
      {isCoursePage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateCourseSchema({
                name: breadcrumbItems[breadcrumbItems.length - 1].name,
                description:
                  "Comprehensive programming course with interactive lessons, quizzes, and hands-on projects.",
                provider: "CourseAI",
                url: breadcrumbItems[breadcrumbItems.length - 1].url,
                imageUrl: `${baseUrl}/images/courses/${pathSegments[pathSegments.length - 1]}.jpg`,
                instructorName: "CourseAI Expert Instructor",
                instructorUrl: `${baseUrl}/instructors/expert`,
                dateCreated: "2023-01-01", // This should be dynamically populated from your CMS or data source
                dateModified: "2023-12-01", // This should be dynamically populated from your CMS or data source
              }),
            ),
          }}
        />
      )}
      {pathname === "/resources" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateFAQSchema([
                {
                  question: "Are all the educational resources on CourseAI free?",
                  answer:
                    "Yes, CourseAI offers a comprehensive collection of free programming tutorials, guides, and interactive learning materials. Premium features are available with paid plans, but our core educational content is accessible to everyone at no cost.",
                },
                {
                  question: "How often are new resources added to CourseAI?",
                  answer:
                    "We add new educational resources weekly, including programming tutorials, coding challenges, and interactive quizzes. Our team constantly updates content to reflect the latest programming languages, frameworks, and industry best practices.",
                },
                {
                  question: "Can I download CourseAI resources for offline use?",
                  answer:
                    "Yes, many of our resources are available for download as PDFs, allowing you to learn programming concepts offline. Premium users can also download video tutorials and interactive exercises.",
                },
                {
                  question: "Does CourseAI offer resources for beginners?",
                  answer:
                    "CourseAI provides a wide range of beginner-friendly resources, including 'Programming 101' guides, 'Coding for Beginners' tutorials, and step-by-step introductions to various programming languages.",
                },
                {
                  question: "How can I contribute to CourseAI's educational resources?",
                  answer:
                    "We welcome contributions from the community! You can submit your own tutorials, exercises, or improvements to existing content through our GitHub repository or the 'Contribute' section on our website.",
                },
                {
                  question: "Do I need to create an account to access the free resources?",
                  answer:
                    "No, most of our free educational resources are accessible without registration. While creating a free account gives you additional benefits like progress tracking and personalized recommendations, you can access our tutorials, guides, and basic quizzes without signing up.",
                },
                {
                  question: "Are there any hidden fees or limitations on the free resources?",
                  answer:
                    "No hidden fees or unexpected charges. Our free resources are completely free with no time limits or trial periods. We offer a substantial library of free programming tutorials, coding exercises, and educational materials with no restrictions on access.",
                },
                {
                  question: "What types of free programming resources do you offer?",
                  answer:
                    "Our free resources include comprehensive programming tutorials, interactive coding exercises, downloadable cheat sheets, video lessons, practice projects, code snippets, algorithm explanations, and community-contributed learning materials covering all major programming languages and frameworks.",
                },
                {
                  question: "How do CourseAI's free resources compare to paid alternatives?",
                  answer:
                    "CourseAI's free resources rival many paid alternatives in quality and comprehensiveness. Our content is created by industry professionals and educators, regularly updated to reflect current best practices, and designed with effective learning methodologies. Many users find our free resources sufficient for learning programming without needing paid courses.",
                },
              ]),
            ),
          }}
        />
      )}
      {(pathname === "/free-resources" || pathname === "/resources") && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFreeResourcesCollectionSchema(baseUrl)),
          }}
        />
      )}
      {isFreeResourcePage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: `Free ${breadcrumbItems[breadcrumbItems.length - 1].name}`,
              description: `Access our free ${breadcrumbItems[breadcrumbItems.length - 1].name} resources, tutorials, and learning materials. No registration required, completely free.`,
              url: breadcrumbItems[breadcrumbItems.length - 1].url,
              isAccessibleForFree: true,
              keywords: `free ${breadcrumbItems[breadcrumbItems.length - 1].name}, no-cost learning, free programming resources, free coding tutorials`,
              mainEntity: {
                "@type": "CreativeWork",
                name: `Free ${breadcrumbItems[breadcrumbItems.length - 1].name} Resources`,
                isAccessibleForFree: true,
              },
            }),
          }}
        />
      )}
      {isMobileAppPage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateSoftwareApplicationSchema(baseUrl)),
          }}
        />
      )}
    </>
  )
}

// Export the schema generators for use in specific pages
export {
  generateQuizSchema,
  generateCourseSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateOrganizationSchema,
  generateWebsiteSchema,
  generatePricingSchema,
  generateWebApplicationSchema,
  generateArticleSchema,
  generateLocalBusinessSchema,
  generateHowToSchema,
  generateFreeResourcesCollectionSchema,
  generateSoftwareApplicationSchema,
}

// Export types for TypeScript support
export type { QuizSchemaParams, CourseSchemaParams, BreadcrumbItem }

