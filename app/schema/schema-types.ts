/**
 * Type definitions for schema and structured data
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
