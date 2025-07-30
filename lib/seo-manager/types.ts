/**
 * Type definitions for SEO and structured data
 */
import { Metadata } from 'next';

/**
 * Base schema.org JSON-LD type
 */
export interface Schema {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: any;
}

/**
 * Site info for schema components
 */
export interface SiteInfo {
  name?: string;
  url?: string;
  logoUrl?: string;
}

/**
 * BreadcrumbItem interface for structured data
 */
export interface BreadcrumbItem {
  position: number;
  name: string;
  url: string;
}

/**
 * FAQ item for structured data (use PascalCase for interface)
 */
export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Options for metadata generation
 */
export interface MetadataOptions {
  title?: string;
  description?: string;
  canonicalPath?: string;
  path?: string;
  ogImage?: string | {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  ogType?: string;
  noIndex?: boolean;
  additionalMetaTags?: Array<{ name: string; content: string }>;
  structuredData?: Record<string, any>;
  keywords?: string[];
}

/**
 * Properties for social image metadata
 */
export interface SocialImageProps {
  title?: string;
  description?: string;
  imagePath?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'book';
}

/**
 * Supported JSON-LD schema types
 */
export type JsonLdType =
  | "website"
  | "webPage"
  | "article"
  | "course"
  | "quiz"
  | "faq"
  | "howTo"
  | "person"
  | "video"
  | "softwareApplication"
  | "webApplication"
  | "organization"
  | "breadcrumbList"
  | "learningResource"
  | "contactPage";

// Type definitions for specific schema data
export interface ArticleData {
  url: string;
  headline: string;
  description: string;
  imageUrl: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  publisherName: string;
  publisherLogoUrl: string;
}

export interface CourseData {
  name: string;
  description: string;
  provider: {
    name: string;
    url?: string;
  };
  url: string;
  imageUrl?: string;
  dateCreated?: string;
  dateModified?: string;
  author?: {
    name: string;
    url?: string;
  };
  educationalLevel?: string;
  timeRequired?: string;
  about?: {
    name: string;
  };
  // --- Added for schema.org compliance ---
  offers?: {
    price: string;
    priceCurrency: string;
    url?: string;
    availability?: string;
    priceValidUntil?: string;
  };
  hasCourseInstance?: {
    name?: string;
    description?: string;
    courseMode?: string;
    startDate?: string;
    endDate?: string;
    location?: {
      url?: string;
    };
  };
}

export interface QuizData {
  name: string;
  description: string;
  url: string;
  numberOfQuestions?: number;
  creator?: {
    name: string;
    url?: string;
  };
  educationalAlignment?: {
    alignmentType: string;
    targetName: string;
  };
  learningResourceType?: string;
}

export interface PersonData {
  name: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  worksFor?: {
    name: string;
    url?: string;
  };
  description?: string;
  sameAs?: string[];
}

export interface VideoData {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  contentUrl?: string;
  embedUrl?: string;
  duration?: string;
  publisher?: {
    name: string;
    url?: string;
    logo?: string;
  };
}

export interface HowToData {
  name: string;
  description: string;
  imageUrl: string;
  totalTime: string;
  url: string;
  steps: Array<{
    name: string;
    text: string;
    url?: string;
    imageUrl?: string;
  }>;
}

export interface OrganizationProps extends SiteInfo {
  description?: string;
  foundingDate?: string;
  sameAs?: string[]; // Social profile URLs
  email?: string;
  telephone?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
}

export interface BreadcrumbListProps {
  items?: BreadcrumbItem[];
  siteUrl?: string;
}

export interface FAQProps {
  items: FaqItem[];
}

export interface CombinedSchemaProps {
  website?: boolean;
  breadcrumbs?: boolean | BreadcrumbListProps;
  organization?: boolean | OrganizationProps;
  faq?: FAQProps;
  siteInfo?: SiteInfo;
}
export interface CourseSchemaProps{

  courseName: string;
  description: string;
  courseUrl: string;
  provider: string;
  providerUrl?: string;
  imageUrl?: string;
  dateCreated?: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
}
export interface JsonLdProps {
  type: JsonLdType;
  data: Record<string, any>;
  scriptProps?: React.HTMLAttributes<HTMLScriptElement>;
}
export interface SchemaProps{
  type: JsonLdType;
  data: Record<string, any>;
  scriptProps?: React.HTMLAttributes<HTMLScriptElement>;

}