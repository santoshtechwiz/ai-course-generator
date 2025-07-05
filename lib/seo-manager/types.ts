import { Metadata } from 'next';

/**
 * SEO Manager - Type definitions
 * 
 * This file contains all type definitions for the SEO Manager.
 * It centralizes all SEO-related types for the application.
 */

/**
 * Base URL utility
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io";
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
 * Schema.org type definitions
 */
export interface SchemaOrgProps {
  title?: string;
  description?: string;
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
    url?: string;
    type?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
  };
  siteUrl?: string;
  siteName?: string;
  imageUrl?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
}

/**
 * Social image props
 */
export interface SocialImageProps {
  title?: string;
  description?: string;
  imagePath?: string;
  url?: string;
  type?: 'website' | 'article' | 'book' | 'profile';
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
 * Basic site information
 */
export interface SiteInfo {
  name?: string;
  url?: string;
  logoUrl?: string;
}

/**
 * Organization props extending SiteInfo
 */
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

/**
 * FAQ item interface
 */
export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Props for breadcrumb list
 */
export interface BreadcrumbListProps {
  items?: BreadcrumbItem[];
  siteUrl?: string;
}

/**
 * Combined schema props
 */
export interface CombinedSchemaProps {
  website?: boolean;
  breadcrumbs?: boolean | BreadcrumbListProps;
  organization?: boolean | OrganizationProps;
  faq?: FAQProps;
  siteInfo?: SiteInfo;
}

/**
 * Props for FAQ schema
 */
export interface FAQProps {
  items: FAQItem[];
}

/**
 * Types for schema data
 */
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
  description?: string;
  url: string;
  image?: string;
  createdAt: string;
  updatedAt?: string;
  instructor?: {
    name: string;
    url: string;
  };
  provider?: {
    name: string;
    url?: string;
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

export interface SoftwareApplicationData {
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem?: string;
  offers?: {
    price: string;
    priceCurrency: string;
    priceValidUntil?: string;
  };
  aggregateRating?: {
    ratingValue: string;
    ratingCount: string;
  };
  screenshot?: string;
  featureList?: string[];
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
  duration?: string; // ISO 8601 format
  publisher?: {
    name: string;
    url?: string;
    logo?: string;
  };
}

export type Schema = Record<string, any>;

/**
 * JSON-LD type definition
 */
export type JsonLdType =
  | "default"
  | "article"
  | "course"
  | "quiz"
  | "faq"
  | "howTo"
  | "person"
  | "video"
  | "softwareApplication"
  | "pricing"
  | "website"
  | "webPage"
  | "contactPage"
  | "organization"
  | "breadcrumbList"
  | "learningResource";

/**
 * Props for SEO schema components
 */
export interface SchemaProps {
  siteUrl?: string;
  siteName?: string;
  logoUrl?: string;
  socialProfiles?: string[];
}

/**
 * Props for JsonLD component
 */
export interface JsonLDProps {
  type: string;
  data?: Record<string, any>;
}

/**
 * Props for Course Schema
 */
export interface CourseSchemaProps {
  courseName: string;
  courseUrl: string;
  description: string;
  provider?: string;
  providerUrl?: string;
  imageUrl?: string;
  dateCreated?: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
}

/**
 * Props for DefaultSEO component
 */
export interface DefaultSEOProps {
  currentPath?: string;
  includeFAQ?: boolean;
  customFAQItems?: Array<{ question: string; answer: string }>;
}
