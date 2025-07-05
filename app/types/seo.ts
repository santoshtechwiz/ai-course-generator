/**
 * SEO related type definitions
 */

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
