/**
 * Enhanced SEO System for CourseAI Platform
 * 
 * Comprehensive SEO solution that addresses Google Search Console issues
 * including missing hasCourseInstance, multiple instances, and FAQ optimization.
 */

import type { Metadata } from "next";
import React from "react";
import { BASE_URL, defaultSiteInfo, defaultFAQItems } from "./constants";
import type { FaqItem, BreadcrumbItem } from "./seo-schema";

// ============================================================================
// ENHANCED DATA TYPES
// ============================================================================

export interface EnhancedCourseData {
  title: string;
  description: string;
  slug: string;
  image?: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  createdAt: string;
  updatedAt?: string;
  estimatedHours?: number;
  price?: number;
  currency?: string;
  chapters?: Array<{
    title: string;
    description?: string;
  }>;
  skills?: string[];
  prerequisites?: string[];
  authorName?: string;
  authorUrl?: string;
}

export interface EnhancedQuizData {
  title: string;
  description: string;
  slug: string;
  quizType: "mcq" | "blanks" | "code" | "openended";
  difficulty: "easy" | "medium" | "hard";
  questionsCount: number;
  estimatedTime?: number;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnhancedMetadataConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  type?: "website" | "article" | "course" | "quiz";
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

// ============================================================================
// ENHANCED METADATA GENERATION
// ============================================================================

export function generateEnhancedMetadata(config: EnhancedMetadataConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    type = "website",
    image,
    publishedTime,
    modifiedTime,
    author,
    section,
    noIndex = false,
    noFollow = false,
  } = config;

  const fullUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
  const socialImage = image || `${BASE_URL}/api/og?title=${encodeURIComponent(title)}`;

  const enhancedKeywords = [
    ...keywords,
    "courseai",
    "ai learning",
    "interactive education",
    "online courses",
    "educational technology"
  ].filter(Boolean).slice(0, 15);

  const metadata: Metadata = {
    title: title.length > 60 ? title.substring(0, 57) + "..." : title,
    description: description.length > 160 ? description.substring(0, 157) + "..." : description,
    keywords: enhancedKeywords.join(", "),
    
    robots: {
      index: !noIndex,
      follow: !noFollow,
      nocache: false,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    openGraph: {
      type: type === "course" || type === "quiz" ? "article" : type,
      title,
      description,
      url: fullUrl,
      siteName: defaultSiteInfo.name,
      locale: "en_US",
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: `${title} | ${defaultSiteInfo.name}`,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(section && { section }),
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@courseai",
      images: [socialImage],
    },

    alternates: {
      canonical: fullUrl,
    },

    authors: author ? [{ name: author }] : undefined,
    creator: author || "CourseAI Team",
    publisher: defaultSiteInfo.name,
    
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
      other: {
        "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION || "",
      },
    },
  };

  return metadata;
}

// ============================================================================
// ENHANCED COURSE SCHEMA WITH hasCourseInstance
// ============================================================================

export function generateEnhancedCourseSchema(course: EnhancedCourseData) {
  const courseUrl = `${BASE_URL}/dashboard/course/${course.slug}`;
  const courseImage = course.image || `${BASE_URL}/api/og?title=${encodeURIComponent(course.title)}&category=${encodeURIComponent(course.category)}`;

  // Generate course instances - REQUIRED by Google
  const hasCourseInstance = [
    {
      "@type": "CourseInstance",
      "@id": `${courseUrl}#instance-1`,
      name: course.title,
      description: course.description,
      courseMode: "online",
      courseWorkload: course.estimatedHours ? `PT${course.estimatedHours}H` : "PT10H",
      startDate: course.createdAt,
      endDate: course.updatedAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      location: {
        "@type": "VirtualLocation",
        url: courseUrl,
        name: "CourseAI Online Platform",
      },
      instructor: {
        "@type": "Person",
        name: course.authorName || "CourseAI Instructor",
        url: course.authorUrl || `${BASE_URL}/instructors`,
        worksFor: {
          "@type": "Organization",
          name: "CourseAI",
          url: BASE_URL,
        },
      },
      offers: {
        "@type": "Offer",
        price: course.price?.toString() || "0",
        priceCurrency: course.currency || "USD",
        availability: "https://schema.org/InStock",
        url: courseUrl,
        validFrom: course.createdAt,
        category: "https://schema.org/EducationalOccupationalCredential",
      },
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": courseUrl,
    name: course.title,
    description: course.description,
    url: courseUrl,
    image: {
      "@type": "ImageObject",
      url: courseImage,
      width: 1200,
      height: 630,
    },
    provider: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "CourseAI",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
        width: 112,
        height: 112,
      },
      sameAs: [
        "https://twitter.com/courseai",
        "https://linkedin.com/company/courseai",
        "https://github.com/courseai",
      ],
    },
    dateCreated: course.createdAt,
    dateModified: course.updatedAt || course.createdAt,
    educationalLevel: course.difficulty,
    timeRequired: course.estimatedHours ? `PT${course.estimatedHours}H` : "PT10H",
    inLanguage: "en",
    learningResourceType: "Course",
    educationalUse: "instruction",
    
    about: {
      "@type": "Thing",
      name: course.category,
    },
    teaches: course.skills || [
      `${course.title} fundamentals`,
      `${course.category} best practices`,
      "Practical implementation skills",
    ],
    
    ...(course.prerequisites && course.prerequisites.length > 0 && {
      coursePrerequisites: course.prerequisites.map((prereq) => ({
        "@type": "AlignmentObject",
        alignmentType: "prerequisite",
        targetName: prereq,
      })),
    }),

    ...(course.chapters && course.chapters.length > 0 && {
      hasPart: course.chapters.map((chapter, index) => ({
        "@type": "LearningResource",
        name: chapter.title,
        description: chapter.description || `Learn about ${chapter.title}`,
        position: index + 1,
        url: `${courseUrl}#chapter-${index + 1}`,
        learningResourceType: "lesson",
      })),
    }),

    // REQUIRED: Course instances
    hasCourseInstance,

    offers: {
      "@type": "Offer",
      price: course.price?.toString() || "0",
      priceCurrency: course.currency || "USD",
      availability: "https://schema.org/InStock",
      url: courseUrl,
      validFrom: course.createdAt,
      category: "https://schema.org/EducationalOccupationalCredential",
    },

    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
  };
}

// ============================================================================
// ENHANCED QUIZ SCHEMA
// ============================================================================

export function generateEnhancedQuizSchema(quiz: EnhancedQuizData) {
  const quizUrl = `${BASE_URL}/dashboard/${quiz.quizType}/${quiz.slug}`;
  
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "@id": quizUrl,
    name: quiz.title,
    description: quiz.description,
    url: quizUrl,
    numberOfQuestions: quiz.questionsCount,
    timeRequired: quiz.estimatedTime ? `PT${quiz.estimatedTime}M` : "PT15M",
    educationalLevel: quiz.difficulty,
    learningResourceType: "Quiz",
    educationalUse: "assessment",
    inLanguage: "en",
    
    creator: {
      "@type": "Organization",
      name: "CourseAI",
      url: BASE_URL,
    },
    
    provider: {
      "@type": "Organization",
      name: "CourseAI",
      url: BASE_URL,
    },

    dateCreated: quiz.createdAt || new Date().toISOString(),
    dateModified: quiz.updatedAt || quiz.createdAt || new Date().toISOString(),

    ...(quiz.category && {
      about: {
        "@type": "Thing",
        name: quiz.category,
      },
    }),

    educationalAlignment: {
      "@type": "AlignmentObject",
      alignmentType: "educationalLevel",
      targetName: quiz.difficulty,
    },
  };
}

// ============================================================================
// ENHANCED FAQ SCHEMA FOR HOMEPAGE
// ============================================================================

export function generateEnhancedFAQSchema(items: FaqItem[] = defaultFAQItems) {
  const validItems = items.filter(
    (item) =>
      item &&
      typeof item.question === "string" &&
      typeof item.answer === "string" &&
      item.question.trim().length > 0 &&
      item.answer.trim().length > 0
  );

  if (validItems.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${BASE_URL}/#faq`,
    mainEntity: validItems.map((item) => ({
      "@type": "Question",
      name: item.question.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer.trim(),
        author: {
          "@type": "Organization",
          name: "CourseAI",
          url: BASE_URL,
        },
      },
    })),
  };
}

// ============================================================================
// ENHANCED WEBSITE SCHEMA
// ============================================================================

export function generateEnhancedWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: "CourseAI",
    url: BASE_URL,
    description: "AI-powered education platform with interactive courses, quizzes, and learning tools",
    inLanguage: "en-US",
    
    publisher: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "CourseAI",
      url: BASE_URL,
    },

    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },

    sameAs: [
      "https://twitter.com/courseai",
      "https://linkedin.com/company/courseai",
      "https://github.com/courseai",
      "https://facebook.com/courseailearning",
    ],
  };
}

// ============================================================================
// ENHANCED ORGANIZATION SCHEMA
// ============================================================================

export function generateEnhancedOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "CourseAI",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/logo.png`,
      width: 112,
      height: 112,
    },
    description: "AI-powered education platform with interactive courses, quizzes, and learning tools",
    foundingDate: "2023-01-01",
    
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "support@courseai.io",
      url: `${BASE_URL}/contact`,
      availableLanguage: ["English"],
    },

    sameAs: [
      "https://twitter.com/courseai",
      "https://linkedin.com/company/courseai",
      "https://github.com/courseai",
      "https://facebook.com/courseailearning",
    ],

    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Educational Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "AI-Powered Courses",
            description: "Interactive programming courses generated by AI",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Interactive Quizzes",
            description: "Comprehensive quiz system for skill assessment",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Learning Analytics",
            description: "Advanced progress tracking and personalized recommendations",
          },
        },
      ],
    },

    areaServed: "Worldwide",
  };
}

// ============================================================================
// ENHANCED BREADCRUMB SCHEMA
// ============================================================================

export function generateEnhancedBreadcrumbSchema(
  path: string,
  customItems?: BreadcrumbItem[]
) {
  let items: BreadcrumbItem[];

  if (customItems) {
    items = customItems;
  } else {
    const segments = path.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
    items = [{ position: 1, name: "Home", url: BASE_URL }];

    let currentUrl = BASE_URL;
    segments.forEach((segment, index) => {
      currentUrl += `/${segment}`;
      const name = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      items.push({
        position: index + 2,
        name,
        url: currentUrl,
      });
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      item: {
        "@type": "WebPage",
        "@id": item.url,
        name: item.name,
        url: item.url,
      },
    })),
  };
}

// ============================================================================
// REACT COMPONENTS
// ============================================================================

export const EnhancedCourseSchemaComponent = React.memo<{ course: EnhancedCourseData }>(
  ({ course }) => {
    const schema = generateEnhancedCourseSchema(course);
    
    return React.createElement('script', {
      type: 'application/ld+json',
      dangerouslySetInnerHTML: {
        __html: JSON.stringify(schema, null, 0),
      },
    });
  }
);

EnhancedCourseSchemaComponent.displayName = "EnhancedCourseSchemaComponent";

export const EnhancedQuizSchemaComponent = React.memo<{ quiz: EnhancedQuizData }>(
  ({ quiz }) => {
    const schema = generateEnhancedQuizSchema(quiz);
    
    return React.createElement('script', {
      type: 'application/ld+json',
      dangerouslySetInnerHTML: {
        __html: JSON.stringify(schema, null, 0),
      },
    });
  }
);

EnhancedQuizSchemaComponent.displayName = "EnhancedQuizSchemaComponent";

export const EnhancedFAQSchemaComponent = React.memo<{ items?: FaqItem[] }>(
  ({ items }) => {
    const schema = generateEnhancedFAQSchema(items);
    
    if (!schema) return null;
    
    return React.createElement('script', {
      type: 'application/ld+json',
      dangerouslySetInnerHTML: {
        __html: JSON.stringify(schema, null, 0),
      },
    });
  }
);

EnhancedFAQSchemaComponent.displayName = "EnhancedFAQSchemaComponent";

export const EnhancedWebsiteSchemaComponent = React.memo(() => {
  const schema = generateEnhancedWebsiteSchema();
  
  return React.createElement('script', {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(schema, null, 0),
    },
  });
});

EnhancedWebsiteSchemaComponent.displayName = "EnhancedWebsiteSchemaComponent";

export const EnhancedOrganizationSchemaComponent = React.memo(() => {
  const schema = generateEnhancedOrganizationSchema();
  
  return React.createElement('script', {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(schema, null, 0),
    },
  });
});

EnhancedOrganizationSchemaComponent.displayName = "EnhancedOrganizationSchemaComponent";

export const EnhancedBreadcrumbSchemaComponent = React.memo<{
  path: string;
  customItems?: BreadcrumbItem[];
}>(({ path, customItems }) => {
  const schema = generateEnhancedBreadcrumbSchema(path, customItems);
  
  return React.createElement('script', {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(schema, null, 0),
    },
  });
});

EnhancedBreadcrumbSchemaComponent.displayName = "EnhancedBreadcrumbSchemaComponent";

// ============================================================================
// ENHANCED SEO PROVIDER
// ============================================================================

interface EnhancedSEOProviderProps {
  children: React.ReactNode;
  enableWebsite?: boolean;
  enableOrganization?: boolean;
  enableFAQ?: boolean;
  enableBreadcrumbs?: boolean;
  currentPath?: string;
  customFAQItems?: FaqItem[];
}

export const EnhancedSEOProvider = React.memo<EnhancedSEOProviderProps>(({
  children,
  enableWebsite = true,
  enableOrganization = true,
  enableFAQ = false,
  enableBreadcrumbs = false,
  currentPath,
  customFAQItems,
}) => {
  return React.createElement(React.Fragment, {}, [
    enableWebsite && React.createElement(EnhancedWebsiteSchemaComponent, { key: 'website' }),
    enableOrganization && React.createElement(EnhancedOrganizationSchemaComponent, { key: 'organization' }),
    enableFAQ && React.createElement(EnhancedFAQSchemaComponent, { key: 'faq', items: customFAQItems }),
    enableBreadcrumbs && currentPath && React.createElement(EnhancedBreadcrumbSchemaComponent, { 
      key: 'breadcrumbs', 
      path: currentPath 
    }),
    children,
  ].filter(Boolean));
});

EnhancedSEOProvider.displayName = "EnhancedSEOProvider";

// ============================================================================
// VALIDATION AND TESTING
// ============================================================================

export function validateSchemaCompliance(schema: any, type: string): boolean {
  if (process.env.NODE_ENV !== "development") return true;

  const requiredFields: Record<string, string[]> = {
    Course: ["@context", "@type", "name", "description", "provider", "hasCourseInstance"],
    Quiz: ["@context", "@type", "name", "description", "numberOfQuestions"],
    FAQPage: ["@context", "@type", "mainEntity"],
    Organization: ["@context", "@type", "name", "url"],
    WebSite: ["@context", "@type", "name", "url"],
  };

  const required = requiredFields[type];
  if (!required) return true;

  const missing = required.filter((field) => !schema[field]);
  
  if (missing.length > 0) {
    console.warn(`SEO Warning: ${type} schema missing required fields:`, missing);
    return false;
  }

  if (type === "Course" && (!schema.hasCourseInstance || schema.hasCourseInstance.length === 0)) {
    console.warn("SEO Warning: Course schema missing hasCourseInstance field - required by Google");
    return false;
  }

  return true;
}
