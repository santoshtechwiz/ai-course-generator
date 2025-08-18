/**
 * Enhanced configuration with comprehensive defaults
 * Centralized configuration management for SEO components
 */

import type { Metadata } from "next"
import { FaqItem, SiteInfo } from "./seo-schema"

// ============================================================================
// ENVIRONMENT AND BASE CONFIGURATION
// ============================================================================

export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://courseai.io"

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "CourseAI"
export const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "AI-powered coding education platform with interactive courses, quizzes, and learning tools"

// ============================================================================
// DEFAULT SITE INFORMATION
// ============================================================================

export const defaultSiteInfo: SiteInfo = {
  name: SITE_NAME,
  url: BASE_URL,
  logoUrl: `${BASE_URL}/logo.png`,
}

// ============================================================================
// COMPREHENSIVE FAQ ITEMS
// ============================================================================

export const defaultFAQItems: FaqItem[] = [
  {
    question: "What is CourseAI?",
    answer:
      "CourseAI is an AI-powered education platform that helps you learn programming concepts through interactive courses, quizzes, and flashcards. Our platform uses advanced AI to create personalized learning experiences tailored to your skill level and learning goals.",
  },
  {
    question: "How does CourseAI generate content?",
    answer:
      "CourseAI uses advanced AI models including GPT-4 and other machine learning algorithms to create personalized learning materials. The AI analyzes your learning patterns, progress, and preferences to generate quizzes, flashcards, and course content that matches your specific needs and learning style.",
  },
  {
    question: "Is CourseAI free to use?",
    answer:
      "CourseAI offers both free and premium plans. The free plan gives you access to basic features including limited quizzes and courses. Premium plans unlock advanced features like unlimited AI-generated content, personalized learning paths, detailed analytics, and priority support.",
  },
  {
    question: "How can I track my progress?",
    answer:
      "CourseAI provides a comprehensive dashboard that tracks your learning progress across all courses and topics. You can view completed courses, quiz scores, time spent learning, areas that need improvement, and personalized recommendations for your next learning steps.",
  },
  {
    question: "Can I create my own courses?",
    answer:
      "Yes, CourseAI allows you to create custom courses on any programming topic. You can design the curriculum, add interactive quizzes, upload resources, and share your courses with the community. Our AI can also help you generate course content and assessments.",
  },
  {
    question: "How do I get started with CourseAI?",
    answer:
      "Getting started is easy! Simply create a free account, complete a brief skill assessment, choose your learning goals, and our AI will recommend personalized courses and learning paths. You can start with beginner-friendly content or jump into advanced topics based on your experience.",
  },
  {
    question: "What programming languages does CourseAI support?",
    answer:
      "CourseAI supports all major programming languages including JavaScript, Python, Java, C++, React, Node.js, and many more. Our AI can generate content for any programming language or technology stack you want to learn.",
  },
  {
    question: "Can I use CourseAI offline?",
    answer:
      "While CourseAI is primarily a web-based platform, we offer offline capabilities for premium users. You can download courses and quizzes for offline study, and your progress will sync when you reconnect to the internet.",
  },
]

// ============================================================================
// SOCIAL MEDIA PROFILES
// ============================================================================

export const defaultSocialProfiles: string[] = [
  "https://twitter.com/courseai",
  "https://github.com/courseai",
  "https://linkedin.com/company/courseai",
  "https://facebook.com/courseailearning",
  "https://youtube.com/c/courseai",
  "https://instagram.com/courseai_official",
]

// ============================================================================
// COMPREHENSIVE DEFAULT METADATA
// ============================================================================

export const defaultMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${SITE_NAME} - Interactive Programming Quizzes and Learning`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "CourseAI Team", url: BASE_URL }],
  generator: "Next.js",
  keywords: [
    "programming education",
    "coding quizzes",
    "AI learning",
    "interactive courses",
    "software development",
    "programming tutorials",
    "coding bootcamp",
    "learn to code",
    "programming practice",
    "developer education",
  ],
  referrer: "origin-when-cross-origin",
  creator: "CourseAI Team",
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Interactive Programming Learning Platform`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/images/og/courseai-og.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Interactive Programming Learning Platform`,
        type: "image/png",
      },
      {
        url: "/images/og/courseai-og-square.png",
        width: 1200,
        height: 1200,
        alt: `${SITE_NAME} Logo`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@courseai",
    creator: "@courseai",
    title: `${SITE_NAME} - Interactive Programming Learning`,
    description: SITE_DESCRIPTION,
    images: ["/images/og/courseai-og.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#5bbad5" }],
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-US": BASE_URL,
      "es-ES": `${BASE_URL}/es`,
      "fr-FR": `${BASE_URL}/fr`,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || "",
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION || "",
      "pinterest-site-verification": process.env.NEXT_PUBLIC_PINTEREST_VERIFICATION || "",
      "facebook-domain-verification": process.env.NEXT_PUBLIC_FACEBOOK_VERIFICATION || "",
    },
  },
  category: "education",
  classification: "Educational Technology",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "theme-color": "#ffffff",
    "msapplication-TileColor": "#da532c",
    "msapplication-config": "/browserconfig.xml",
  },
}

// ============================================================================
// SCHEMA.ORG DEFAULTS
// ============================================================================

export const DEFAULT_ORGANIZATION_DATA = {
  name: SITE_NAME,
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description: SITE_DESCRIPTION,
  foundingDate: "2023-01-01",
  sameAs: defaultSocialProfiles,
  contactPoint: {
    contactType: "customer support",
    email: "support@courseai.io",
    url: `${BASE_URL}/contact`,
    availableLanguage: ["English", "Spanish", "French"],
  },
  address: {
    addressCountry: "US",
    addressRegion: "CA",
    addressLocality: "San Francisco",
  },
  areaServed: "Worldwide",
  hasOfferCatalog: {
    name: "Educational Services",
    itemListElement: [
      "Programming Courses",
      "Interactive Quizzes",
      "AI-Powered Learning",
      "Coding Bootcamps",
      "Developer Certification",
    ],
  },
}

export const DEFAULT_WEBSITE_DATA = {
  name: SITE_NAME,
  url: BASE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en-US",
  copyrightYear: new Date().getFullYear(),
  copyrightHolder: {
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
  },
  publisher: DEFAULT_ORGANIZATION_DATA,
  potentialAction: {
    "@type": "SearchAction",
    target: `${BASE_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
}

// ============================================================================
// SEO CONFIGURATION
// ============================================================================

export const SEO_CONFIG = {
  defaultTitle: `${SITE_NAME} - Interactive Programming Learning`,
  titleTemplate: `%s | ${SITE_NAME}`,
  defaultDescription: SITE_DESCRIPTION,
  siteUrl: BASE_URL,
  defaultImage: "/images/og/courseai-og.png",
  twitterHandle: "@courseai",
  facebookAppId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "",

  // Content limits
  titleLimit: 60,
  descriptionLimit: 160,
  keywordsLimit: 10,

  // Feature flags
  enableStructuredData: true,
  enableOpenGraph: true,
  enableTwitterCards: true,
  enableCanonicalUrls: true,
  enableRobotsTxt: true,
  enableSitemap: true,

  // Default robots settings
  defaultRobots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
}
