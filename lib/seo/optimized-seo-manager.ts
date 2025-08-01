/**
 * Optimized SEO Manager - Clean, performance-focused SEO utilities
 * Streamlined for better maintainability and faster builds
 */

import type { Metadata } from "next";
import { BASE_URL, defaultSiteInfo } from './constants';

export interface OptimizedSEOOptions {
  title: string;
  description: string;
  keywords?: string[];
  canonicalPath?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  image?: string;
  type?: "website" | "article" | "course" | "quiz";
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
}

/**
 * Generates clean, SEO-optimized metadata
 */
export function generateOptimizedMetadata(options: OptimizedSEOOptions): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonicalPath,
    noIndex = false,
    noFollow = false,
    image,
    type = "website",
    publishedAt,
    updatedAt,
    author,
  } = options;

  const fullUrl = canonicalPath ? `${BASE_URL}${canonicalPath}` : BASE_URL;
  const imageUrl = image || `${BASE_URL}/api/og?title=${encodeURIComponent(title)}`;

  // Clean, efficient robots configuration
  const robots = {
    index: !noIndex,
    follow: !noFollow,
    googleBot: {
      index: !noIndex,
      follow: !noFollow,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
      'max-video-preview': -1,
    },
    ...(noIndex && { nocache: true }),
  };

  const ogType = (type === 'course' || type === 'quiz') ? 'website' : type;

  return {
    title: {
      default: title,
      template: `%s | ${defaultSiteInfo.name}`,
    },
    description: cleanDescription(description),
    keywords: optimizeKeywords(keywords, title, description).join(", "),
    robots,
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title,
      description: cleanDescription(description),
      url: fullUrl,
      siteName: defaultSiteInfo.name,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${title} | ${defaultSiteInfo.name}`,
        },
      ],
      locale: 'en_US',
      type: ogType,
      ...(publishedAt && { publishedTime: publishedAt }),
      ...(updatedAt && { modifiedTime: updatedAt }),
      ...(author && { authors: [author] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanTitle(title),
      description: cleanDescription(description),
      images: [imageUrl],
      creator: '@courseai',
      site: '@courseai',
    },
    other: {
      'theme-color': '#0066cc',
      'color-scheme': 'light dark',
    },
  };
}

/**
 * Optimizes title for better SEO
 */
export function cleanTitle(title: string): string {
  // Remove excessive words and optimize length
  if (title.length > 60) {
    return title.substring(0, 57) + '...';
  }
  return title;
}

/**
 * Optimizes description for better SEO
 */
export function cleanDescription(description: string): string {
  // Ensure optimal length for meta descriptions
  if (description.length > 160) {
    const truncateIndex = description.lastIndexOf(' ', 157);
    return description.substring(0, truncateIndex > 0 ? truncateIndex : 157) + '...';
  }
  return description;
}

/**
 * Optimizes keywords for better relevance
 */
export function optimizeKeywords(keywords: string[], title: string, description: string): string[] {
  // Extract important terms
  const titleWords = title.toLowerCase().split(' ').filter(word => 
    word.length > 2 && !isStopWord(word)
  );
  
  const descWords = description.toLowerCase().split(' ').filter(word => 
    word.length > 3 && !isStopWord(word)
  );
  
  // Combine and deduplicate
  const allKeywords = new Set([
    ...keywords.map(k => k.toLowerCase()),
    ...titleWords.slice(0, 3),
    ...descWords.slice(0, 2),
    'courseai', // Brand keyword
  ]);
  
  return Array.from(allKeywords).slice(0, 12); // Optimal keyword count
}

/**
 * Check if word is a stop word
 */
function isStopWord(word: string): boolean {
  const stopWords = ['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with', 'or', 'but'];
  return stopWords.includes(word.toLowerCase());
}

/**
 * Generates enhanced structured data
 */
export function generateCleanStructuredData(options: {
  type: 'course' | 'quiz' | 'article' | 'organization' | 'breadcrumb';
  data: Record<string, any>;
}): Record<string, any> {
  const { type, data } = options;
  
  return {
    '@context': 'https://schema.org',
    '@type': type.charAt(0).toUpperCase() + type.slice(1),
    ...data,
    ...(type === 'course' && {
      provider: {
        '@type': 'Organization',
        name: defaultSiteInfo.name,
        url: defaultSiteInfo.url,
      },
      educationalLevel: data.difficulty || 'Beginner',
    }),
    ...(type === 'quiz' && {
      educationalUse: 'Assessment',
      creator: {
        '@type': 'Organization',
        name: defaultSiteInfo.name,
      },
    }),
  };
}

/**
 * Validates metadata for SEO compliance
 */
export function validateMetadata(metadata: Metadata): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check title length
  if (typeof metadata.title === 'string' && metadata.title.length > 60) {
    issues.push('Title exceeds 60 characters');
  }
  
  // Check description length
  if (metadata.description && metadata.description.length > 160) {
    issues.push('Description exceeds 160 characters');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}
