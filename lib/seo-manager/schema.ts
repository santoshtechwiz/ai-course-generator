import { 
  BreadcrumbItem, 
  Schema, 
  ArticleData, 
  CourseData, 
  QuizData, 
  FAQItem, 
  HowToData, 
  PricingPlan, 
  PersonData, 
  VideoData,
  SoftwareApplicationData 
} from './types';
import { getBaseUrl } from './types';

/**
 * SEO Manager - Schema.org generators
 * 
 * This file contains functions for generating Schema.org structured data.
 * It provides a centralized way to handle JSON-LD schemas across the application.
 */

/**
 * Schema Generators
 */

/**
 * Generates WebSite schema
 * @returns Schema.org WebSite schema
 */
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

/**
 * Generates WebApplication schema
 * @returns Schema.org WebApplication schema
 */
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

/**
 * Generates SoftwareApplication schema
 * @param data Optional data to customize the schema
 * @returns Schema.org SoftwareApplication schema
 */
export function generateSoftwareApplicationSchema(data?: Partial<SoftwareApplicationData>): Schema {
  const baseUrl = getBaseUrl();
  const defaultData: SoftwareApplicationData = {
    name: "CourseAI",
    description: "AI-powered coding education platform with interactive courses, quizzes, and learning tools",
    url: baseUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      ratingValue: "4.8",
      ratingCount: "250",
    },
    screenshot: `${baseUrl}/images/app-screenshot.jpg`,
    featureList: [
      "AI-generated quizzes",
      "Interactive coding exercises",
      "Course creation tools",
      "Learning analytics",
    ],
  };

  const mergedData = { ...defaultData, ...data };

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: mergedData.name,
    description: mergedData.description,
    url: mergedData.url,
    applicationCategory: mergedData.applicationCategory,
    operatingSystem: mergedData.operatingSystem,
    offers: mergedData.offers
      ? {
          "@type": "Offer",
          price: mergedData.offers.price,
          priceCurrency: mergedData.offers.priceCurrency,
          ...(mergedData.offers.priceValidUntil && { priceValidUntil: mergedData.offers.priceValidUntil }),
        }
      : undefined,
    ...(mergedData.aggregateRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: mergedData.aggregateRating.ratingValue,
        ratingCount: mergedData.aggregateRating.ratingCount,
        bestRating: "5",
      },
    }),
    ...(mergedData.screenshot && { screenshot: mergedData.screenshot }),
    ...(mergedData.featureList && { featureList: mergedData.featureList.join(", ") }),
  };
}

/**
 * Generates Organization schema
 * @returns Schema.org Organization schema
 */
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

/**
 * Generates BreadcrumbList schema
 * @param items Array of breadcrumb items
 * @returns Schema.org BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: item.position || index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generates Article schema
 * @param data Article data
 * @returns Schema.org Article schema
 */
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

/**
 * Generates Course schema
 * @param course Course data
 * @returns Schema.org Course schema
 */
export function generateCourseSchema(course: CourseData): Schema {
  const baseUrl = getBaseUrl();
  const defaultCourseImage = `${baseUrl}/images/default-course.jpg`;

  // Default provider if not specified
  const defaultProvider = {
    "@type": "Organization",
    name: "CourseAI",
    sameAs: baseUrl,
  };

  // Ensure description is always present
  const courseDescription = course.description || `Learn ${course.title} with CourseAI`;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: courseDescription,
    url: course.url,
    image: course.image || defaultCourseImage,
    provider: course.provider
      ? {
          "@type": "Organization",
          name: course.provider.name,
          ...(course.provider.url && { sameAs: course.provider.url }),
        }
      : defaultProvider,
    educationalLevel: course.difficulty || "Beginner",
    timeRequired: course.estimatedHours ? `PT${course.estimatedHours}H` : undefined,
    category: "Programming",
    dateCreated: course.createdAt,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseWorkload: "PT1H",
      name: course.title,
      description: courseDescription,
      courseMode: "online",
      startDate: course.createdAt,
      endDate: course.updatedAt || course.createdAt,
      location: {
        "@type": "VirtualLocation",
        url: course.url,
      },
    },
    ...(course.instructor && {
      instructor: {
        "@type": "Person",
        name: course.instructor.name || "CourseAI Instructor",
        url: course.instructor.url || getBaseUrl(),
      },
    }),
    ...(course.courseUnits && {
      hasPart: course.courseUnits.map((unit) => ({
        "@type": "Course",
        name: unit.title,
        description: unit.title || "Course unit",
        url: `${course.url}#${unit.title.replace(/\s+/g, "-").toLowerCase()}`,
        image: course.image || defaultCourseImage,
        provider: {
          "@type": "Organization",
          name: "CourseAI",
          sameAs: baseUrl,
        },
      })),
    }),
    offers: {
      "@type": "Offer",
      price: course.price || "0",
      category: "https://schema.org/OnlineCourse",
      priceCurrency: course.priceCurrency || "USD",
      url: course.url,
      availability: "https://schema.org/InStock",
      ...(course.priceValidUntil && { priceValidUntil: course.priceValidUntil }),
    },
  };
}

/**
 * Generates Quiz schema
 * @param data Quiz data
 * @returns Schema.org Quiz schema
 */
export function generateQuizSchema(data: QuizData): Schema {
  const baseUrl = getBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: data.title,
    description: data.description,
    url: data.url,
    dateCreated: data.dateCreated || new Date().toISOString(),
    author: data.author
      ? {
          "@type": "Person",
          name: data.author.name,
          url: data.author.url,
        }
      : {
          "@type": "Organization",
          name: "CourseAI",
          url: baseUrl,
        },
    ...(data.questions && {
      hasPart: data.questions.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: q.acceptedAnswer,
        },
      })),
    }),
    about: {
      "@type": "Thing",
      name: "Programming Education",
    },
  };
}

/**
 * Generates FAQ schema
 * @param items Array of FAQ items
 * @returns Schema.org FAQPage schema
 */
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

/**
 * Generates HowTo schema
 * @param data HowTo data
 * @returns Schema.org HowTo schema
 */
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

/**
 * Generates Pricing schema
 * @param plans Array of pricing plans
 * @returns Schema.org Product schema with offers
 */
export function generatePricingSchema(plans: PricingPlan[] = []): Schema {
  const baseUrl = getBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "CourseAI Subscription",
    description: "Access to premium programming courses, quizzes, and learning tools",
    url: `${baseUrl}/pricing`,
    image: `${baseUrl}/images/pricing.png`,
    brand: {
      "@type": "Brand",
      name: "CourseAI",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: plans.length ? Math.min(...plans.map((p) => parseFloat(p.price))) : 0,
      highPrice: plans.length ? Math.max(...plans.map((p) => parseFloat(p.price))) : 29.99,
      offerCount: plans.length || 3,
      offers: plans.length
        ? plans.map((plan) => ({
            "@type": "Offer",
            name: plan.name,
            price: plan.price,
            priceCurrency: plan.priceCurrency,
            description: plan.description,
            url: plan.url,
            availability: "https://schema.org/InStock",
          }))
        : [
            {
              "@type": "Offer",
              name: "Free",
              price: "0",
              priceCurrency: "USD",
              description: "Basic access to courses and quizzes",
              url: `${baseUrl}/pricing#free`,
              availability: "https://schema.org/InStock",
            },
            {
              "@type": "Offer",
              name: "PREMIUM",
              price: "9.99",
              priceCurrency: "USD",
              description: "Full access to all courses and quizzes",
              url: `${baseUrl}/pricing#pro`,
              availability: "https://schema.org/InStock",
            },
            {
              "@type": "Offer",
              name: "Team",
              price: "29.99",
              priceCurrency: "USD",
              description: "Team access with admin controls",
              url: `${baseUrl}/pricing#team`,
              availability: "https://schema.org/InStock",
            },
          ],
    },
  };
}

/**
 * Generates Person schema
 * @param data Person data
 * @returns Schema.org Person schema
 */
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

/**
 * Generates Video schema
 * @param data Video data
 * @returns Schema.org VideoObject schema
 */
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

/**
 * Schema Registry for better organization and extensibility
 */
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
  Pricing: generatePricingSchema,
  Person: generatePersonSchema,
  Video: generateVideoSchema,
};

/**
 * Schema Registry Service for better organization and extensibility
 */
export class SchemaRegistryService {
  private customSchemas: Record<string, (data?: any) => Schema> = {};

  /**
   * Register a custom schema generator
   * @param name Name of the schema
   * @param generator Function that generates the schema
   */
  public register(name: string, generator: (data?: any) => Schema): void {
    this.customSchemas[name] = generator;
  }

  /**
   * Get a schema generator by name
   * @param name Name of the schema
   * @returns Schema generator function or undefined if not found
   */
  public get(name: string): ((data?: any) => Schema) | undefined {
    const baseRegistry = SchemaRegistry as Record<string, (data?: any) => Schema>;
    return baseRegistry[name] || this.customSchemas[name];
  }

  /**
   * Generate a schema by name
   * @param name Name of the schema
   * @param data Optional data for the schema
   * @returns Generated schema or null if generator not found
   */
  public generate(name: string, data?: any): Schema | null {
    const generator = this.get(name);
    if (!generator) {
      console.warn(`Schema generator "${name}" not found`);
      return null;
    }

    try {
      return generator(data);
    } catch (error) {
      console.error(`Error generating schema "${name}":`, error);
      return null;
    }
  }

  /**
   * Get all available schema types
   * @returns Array of schema type names
   */
  public getAvailableSchemas(): string[] {
    const baseRegistry = SchemaRegistry as Record<string, (data?: any) => Schema>;
    return [...Object.keys(baseRegistry), ...Object.keys(this.customSchemas)];
  }
}

// Create and export a singleton instance
export const schemaRegistry = new SchemaRegistryService();
