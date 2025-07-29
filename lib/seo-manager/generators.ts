/**
 * Schema.org structured data generators (functional API)
 */
import {
  Schema,
  ArticleData,
  CourseData,
  QuizData,
  BreadcrumbItem,
  FAQItem,
  HowToData,
  PersonData,
  VideoData
} from './types';
import { BASE_URL } from './config';

// Helper to get the base URL
function getBaseUrl() {
  return BASE_URL;
}

// Schema Generators
export function generateWebsiteSchema(): Schema {
  const baseUrl = getBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "CourseAI",
    description: "AI-powered coding education platform with interactive courses, quizzes, and learning tools",
    publisher: {
      "@type": "Organization",
      name: "CourseAI",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
        width: 112,
        height: 112,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateWebApplicationSchema(): Schema {
  const baseUrl = getBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "CourseAI",
    url: baseUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: "AI-powered coding education platform with interactive courses, quizzes, and learning tools",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "250",
      bestRating: "5",
    },
  };
}

export function generateSoftwareApplicationSchema(): Schema {
  const baseUrl = getBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CourseAI",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web platform",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: "AI-powered coding education platform with interactive courses, quizzes, and learning tools",
  };
}

export function generateOrganizationSchema(): Schema {
  const baseUrl = getBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "CourseAI",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo.png`,
      width: 112,
      height: 112,
    },
    sameAs: [
      "https://twitter.com/courseai",
      "https://www.linkedin.com/company/courseai",
      "https://github.com/courseai",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@courseai.io",
      url: `${baseUrl}/contact`,
    },
  };
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      item: {
        "@type": "Thing",
        "@id": item.url,
        name: item.name
      },
    })),
  };
}

export function generateArticleSchema(data: ArticleData): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": data.url,
    },
    headline: data.headline,
    description: data.description,
    image: data.imageUrl,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    author: {
      "@type": "Person",
      name: data.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: data.publisherName,
      logo: {
        "@type": "ImageObject",
        url: data.publisherLogoUrl,
        width: 112,
        height: 112,
      },
    },
  };
}

export function generateCourseSchema(course: CourseData): Schema {
  // Enhanced Course schema for SEO: more fields, better compliance, and rich data
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.description,
    url: course.url,
    provider: {
      "@type": "Organization",
      name: course.provider.name,
      ...(course.provider.url && { sameAs: course.provider.url }),
    },
    ...(course.imageUrl && { image: course.imageUrl }),
    ...(course.dateCreated && { dateCreated: course.dateCreated }),
    ...(course.dateModified && { dateModified: course.dateModified }),
    ...(course.author && {
      author: {
        "@type": "Person",
        name: course.author.name,
        ...(course.author.url && { url: course.author.url }),
      },
    }),
    ...(course.educationalLevel && { educationalLevel: course.educationalLevel }),
    ...(course.timeRequired && { timeRequired: course.timeRequired }),
    ...(course.about && {
      about: {
        "@type": "Thing",
        name: course.about.name,
      },
    }),
    // Always include offers (even if null/empty) to satisfy schema.org requirements
    offers: course.offers
      ? {
          "@type": "Offer",
          price: course.offers.price,
          priceCurrency: course.offers.priceCurrency,
          url: course.offers.url || course.url,
          availability: course.offers.availability || "https://schema.org/InStock",
          ...(course.offers.priceValidUntil && { priceValidUntil: course.offers.priceValidUntil }),
        }
      : {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          url: course.url,
          availability: "https://schema.org/InStock",
        },
    // Always include hasCourseInstance (even if null/empty) to satisfy schema.org requirements
    hasCourseInstance: course.hasCourseInstance
      ? {
          "@type": "CourseInstance",
          name: course.hasCourseInstance.name || course.name,
          description: course.hasCourseInstance.description || course.description,
          courseMode: course.hasCourseInstance.courseMode || "online",
          startDate: course.hasCourseInstance.startDate || course.dateCreated,
          endDate: course.hasCourseInstance.endDate || course.dateModified,
          location: {
            "@type": "VirtualLocation",
            url:
              (course.hasCourseInstance.location && course.hasCourseInstance.location.url) ||
              course.url,
          },
        }
      : {
          "@type": "CourseInstance",
          name: course.name,
          description: course.description,
          courseMode: "online",
          startDate: course.dateCreated,
          endDate: course.dateModified,
          location: {
            "@type": "VirtualLocation",
            url: course.url,
          },
        },
  };
}

export function generateQuizSchema(data: QuizData): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: data.name,
    description: data.description,
    url: data.url,
    ...(data.numberOfQuestions && { numberOfQuestions: data.numberOfQuestions }),
    ...(data.creator && {
      creator: {
        "@type": "Person",
        name: data.creator.name,
        ...(data.creator.url && { url: data.creator.url }),
      },
    }),
    ...(data.educationalAlignment && {
      educationalAlignment: {
        "@type": "AlignmentObject",
        alignmentType: data.educationalAlignment.alignmentType,
        targetName: data.educationalAlignment.targetName,
      },
    }),
    ...(data.learningResourceType && { learningResourceType: data.learningResourceType }),
  };
}

export function generateFAQSchema(items: FAQItem[]): Schema {
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
  };
}

export function generateHowToSchema(data: HowToData): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: data.name,
    description: data.description,
    image: data.imageUrl,
    totalTime: data.totalTime,
    step: data.steps.map((step, index) => ({
      "@type": "HowToStep",
      url: step.url || `${data.url}#step-${index + 1}`,
      name: step.name,
      itemListElement: {
        "@type": "HowToDirection",
        text: step.text,
      },
      ...(step.imageUrl && { image: step.imageUrl }),
    })),
  };
}

export function generatePersonSchema(data: PersonData): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.name,
    ...(data.url && { url: data.url }),
    ...(data.image && { image: data.image }),
    ...(data.jobTitle && { jobTitle: data.jobTitle }),
    ...(data.worksFor && {
      worksFor: {
        "@type": "Organization",
        name: data.worksFor.name,
        ...(data.worksFor.url && { url: data.worksFor.url }),
      },
    }),
    ...(data.description && { description: data.description }),
    ...(data.sameAs && { sameAs: data.sameAs }),
  };
}

export function generateVideoSchema(data: VideoData): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: data.name,
    description: data.description,
    thumbnailUrl: data.thumbnailUrl,
    uploadDate: data.uploadDate,
    ...(data.contentUrl && { contentUrl: data.contentUrl }),
    ...(data.embedUrl && { embedUrl: data.embedUrl }),
    ...(data.duration && { duration: data.duration }),
    ...(data.publisher && {
      publisher: {
        "@type": "Organization",
        name: data.publisher.name,
        ...(data.publisher.url && { url: data.publisher.url }),
        ...(data.publisher.logo && {
          logo: {
            "@type": "ImageObject",
            url: data.publisher.logo,
            width: 112,
            height: 112,
          },
        }),
      },
    }),
  };
}

// Schema Registry for better organization and extensibility
export const SchemaRegistry = {
  Website: generateWebsiteSchema,
  WebApplication: generateWebApplicationSchema,
  SoftwareApplication: generateSoftwareApplicationSchema,
  Organization: generateOrganizationSchema,
  Breadcrumb: generateBreadcrumbSchema,
  Article: generateArticleSchema,
  Course: generateCourseSchema,
  Quiz: generateQuizSchema,
  FAQ: generateFAQSchema,
  HowTo: generateHowToSchema,
  Person: generatePersonSchema,
  Video: generateVideoSchema,
};
