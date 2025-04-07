// Base URL utility
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io";
}

// Types for schema data
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ArticleData {
  headline: string;
  description: string;
  url: string;
  imageUrl: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  publisherName: string;
  publisherLogoUrl: string;
}

export interface CourseData {
  title: string;
  description: string;
  url: string;
  image?: string;
  createdAt: string;
  updatedAt?: string;
  instructor?: {
    name: string;
    url: string;
  };
  difficulty?: string;
  estimatedHours?: number;
  courseUnits?: Array<{ title: string }>;
  price?: string;
  priceCurrency?: string;
  priceValidUntil?: string;
}

export interface QuizData {
  title: string;
  description: string;
  url: string;
  questions?: Array<{
    question: string;
    acceptedAnswer: string;
  }>;
  dateCreated?: string;
  author?: {
    name: string;
    url: string;
  };
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
  url?: string;
  imageUrl?: string;
}

export interface HowToData {
  name: string;
  description: string;
  url: string;
  imageUrl: string;
  totalTime: string;
  steps: HowToStep[];
}

export interface PricingPlan {
  name: string;
  price: string;
  priceCurrency: string;
  description: string;
  url: string;
}

export type Schema = Record<string, any>;

// Generate breadcrumb items from URL path
export function generateBreadcrumbItemsFromPath(path: string): BreadcrumbItem[] {
  const baseUrl = getBaseUrl();
  const segments = path.split("/").filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [{ name: "Home", url: baseUrl }];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const name = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    breadcrumbs.push({
      name,
      url: `${baseUrl}${currentPath}`,
    });
  }

  return breadcrumbs;
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
    },
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
      url: baseUrl,
    },
  };
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
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
      },
    },
  };
}

export function generateCourseSchema(course: CourseData): Schema {
  const baseUrl = getBaseUrl();
  const defaultCourseImage = `${baseUrl}/images/default-course.jpg`;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    url: course.url,
    image: course.image || defaultCourseImage,
    provider: {
      "@type": "Organization",
      name: "CourseAI",
      sameAs: baseUrl,
    },
    educationalLevel: course.difficulty || "Beginner",
    timeRequired: course.estimatedHours ? `PT${course.estimatedHours}H` : undefined,
    courseWorkload: course.estimatedHours|| "PT10H",
    dateCreated: course.createdAt,
    hasCourseInstance: {
      "@type": "CourseInstance",
      name: course.title,
      description: course.description,
      courseMode: "online",
      startDate: course.createdAt,
      endDate: course.updatedAt,
      location: {
        "@type": "VirtualLocation",
        url: course.url,
      },
    },
    ...(course.instructor && {
      instructor: {
        "@type": "Person",
        name: "CourseAI Instructor",
        url: getBaseUrl(),
      },
    }),
    ...(course.courseUnits && {
      hasPart: course.courseUnits.map((unit) => ({
        "@type": "Course",
        name: unit.title,
      })),
    }),
    offers: {
      "@type": "Offer",
      price: course.price || "0",
      priceCurrency: course.priceCurrency || "USD",
      url: course.url,
      availability: "https://schema.org/InStock",
      ...(course.priceValidUntil && { priceValidUntil: course.priceValidUntil }),
    },
  };
}

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

export function generatePricingSchema(plans: PricingPlan[] = []): Schema {
  const baseUrl = getBaseUrl();
  const defaultPlans: PricingPlan[] = [
    {
      name: "Free Plan",
      price: "0",
      priceCurrency: "USD",
      description: "Basic access to CourseAI's learning platform",
      url: `${baseUrl}/pricing`,
    },
    {
      name: "Premium Monthly",
      price: "19.99",
      priceCurrency: "USD",
      description: "Full access to all premium features with monthly billing",
      url: `${baseUrl}/pricing`,
    },
    {
      name: "Premium Annual",
      price: "199.99",
      priceCurrency: "USD",
      description: "Full access to all premium features with annual billing (save 17%)",
      url: `${baseUrl}/pricing`,
    },
  ];

  const offers = (plans.length > 0 ? plans : defaultPlans).map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    price: plan.price,
    priceCurrency: plan.priceCurrency,
    description: plan.description,
    url: plan.url,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "CourseAI Premium Subscription",
    description: "Access to all premium features of CourseAI's coding education platform",
    image: `${baseUrl}/images/premium-subscription.jpg`,
    offers,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "250",
    },
  };
}