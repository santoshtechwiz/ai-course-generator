/**
 * Enhanced SEO Manager - Comprehensive SEO optimization for CourseAI
 * Provides advanced metadata generation, structured data, and indexability optimizations
 */

import type { Metadata } from "next";
import { BASE_URL, defaultSiteInfo } from './constants';

export interface EnhancedSEOOptions {
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
  section?: string;
  priority?: number;
  changeFreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  structuredData?: Record<string, any>;
  additionalMeta?: Record<string, string>;
}

/**
 * Generates comprehensive metadata with advanced SEO optimizations
 */
export function generateEnhancedMetadata(options: EnhancedSEOOptions): Metadata {
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
    section,
  } = options;

  const fullUrl = canonicalPath ? `${BASE_URL}${canonicalPath}` : BASE_URL;
  const imageUrl = image || `${BASE_URL}/api/og?title=${encodeURIComponent(title)}`;

  // Enhanced robots configuration
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
    description: optimizeDescription(description),
    keywords: optimizeKeywords(keywords, title, description).join(", "),
    robots,
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title,
      description: optimizeDescription(description),
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
      ...(section && { section }),
    },
    twitter: {
      card: 'summary_large_image',
      title: optimizeTitle(title),
      description: optimizeDescription(description),
      images: [imageUrl],
      creator: '@courseai',
      site: '@courseai',
    },
    other: {
      'theme-color': '#0066cc',
      'color-scheme': 'light dark',
      'msapplication-TileColor': '#0066cc',
    },
  };
}

/**
 * Optimizes title for better SEO by removing stop words and improving readability
 */
export function optimizeTitle(title: string): string {
  // Remove common stop words that don't add SEO value
  const stopWords = ['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with'];
  
  const words = title.split(' ');
  const optimizedWords = words.filter((word, index) => {
    // Keep first and last words regardless
    if (index === 0 || index === words.length - 1) return true;
    // Remove stop words from middle
    return !stopWords.includes(word.toLowerCase());
  });
  
  let optimizedTitle = optimizedWords.join(' ');
  
  // Ensure title is within optimal length (50-60 characters)
  if (optimizedTitle.length > 60) {
    optimizedTitle = optimizedTitle.substring(0, 57) + '...';
  }
  
  return optimizedTitle;
}

/**
 * Optimizes description for better SEO and removes stop words where appropriate
 */
export function optimizeDescription(description: string): string {
  // Ensure description is within optimal length (150-160 characters)
  if (description.length > 160) {
    const truncateIndex = description.lastIndexOf(' ', 157);
    description = description.substring(0, truncateIndex > 0 ? truncateIndex : 157) + '...';
  }
  
  // Remove excessive stop words for better density
  const sentences = description.split('. ');
  const optimizedSentences = sentences.map(sentence => {
    const words = sentence.split(' ');
    if (words.length > 10) {
      // For longer sentences, reduce stop word density
      const stopWords = ['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
      let stopWordCount = 0;
      return words.filter(word => {
        if (stopWords.includes(word.toLowerCase())) {
          stopWordCount++;
          // Keep only essential stop words (max 30% of sentence)
          return stopWordCount <= Math.floor(words.length * 0.3);
        }
        return true;
      }).join(' ');
    }
    return sentence;
  });
  
  return optimizedSentences.join('. ');
}

/**
 * Optimizes keywords by removing stop words and enhancing relevance
 */
export function optimizeKeywords(keywords: string[], title: string, description: string): string[] {
  const stopWords = ['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very'];
  
  // Extract important terms from title and description
  const titleWords = title.toLowerCase().split(' ').filter(word => 
    word.length > 2 && !stopWords.includes(word)
  );
  
  const descWords = description.toLowerCase().split(' ').filter(word => 
    word.length > 3 && !stopWords.includes(word)
  );
  
  // Combine and deduplicate keywords
  const allKeywords = new Set([
    ...keywords.map(k => k.toLowerCase()),
    ...titleWords.slice(0, 3), // Top 3 from title
    ...descWords.slice(0, 2), // Top 2 from description
  ]);
  
  // Add CourseAI-specific relevant terms
  const platformKeywords = ['courseai', 'ai education', 'online learning', 'educational technology'];
  platformKeywords.forEach(keyword => allKeywords.add(keyword));
  
  // Convert back to array and limit to 15 keywords for optimal SEO
  return Array.from(allKeywords).slice(0, 15);
}

/**
 * Generates enhanced structured data for better search engine understanding
 */
export function generateEnhancedStructuredData(options: {
  type: 'course' | 'quiz' | 'article' | 'organization' | 'breadcrumb';
  data: Record<string, any>;
}): Record<string, any> {
  const { type, data } = options;
  
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': type.charAt(0).toUpperCase() + type.slice(1),
    ...data,
  };

  // Add enhanced properties based on type
  switch (type) {
    case 'course':
      return {
        ...baseStructuredData,
        provider: {
          '@type': 'Organization',
          name: defaultSiteInfo.name,
          url: defaultSiteInfo.url,
        },
        educationalLevel: data.difficulty || 'Beginner',
        teaches: data.learningOutcomes || [],
        coursePrerequisites: data.prerequisites || [],
        aggregateRating: data.rating && {
          '@type': 'AggregateRating',
          ratingValue: data.rating,
          reviewCount: data.reviewCount || 1,
        },
      };
      
    case 'quiz':
      return {
        ...baseStructuredData,
        educationalUse: 'Assessment',
        learningResourceType: 'Quiz',
        interactivityType: 'active',
        creator: {
          '@type': 'Organization',
          name: defaultSiteInfo.name,
        },
      };
      
    default:
      return baseStructuredData;
  }
}

/**
 * Validates and optimizes metadata for search engine compliance
 */
export function validateAndOptimizeMetadata(metadata: Metadata): {
  isValid: boolean;
  issues: string[];
  optimizedMetadata: Metadata;
} {
  const issues: string[] = [];
  let optimizedMetadata = { ...metadata };
  
  // Check title
  if (typeof metadata.title === 'string') {
    if (metadata.title.length > 60) {
      issues.push('Title exceeds 60 characters');
      optimizedMetadata.title = optimizeTitle(metadata.title);
    }
  }
  
  // Check description
  if (metadata.description && metadata.description.length > 160) {
    issues.push('Description exceeds 160 characters');
    optimizedMetadata.description = optimizeDescription(metadata.description);
  }
  
  // Check keywords
  if (metadata.keywords && typeof metadata.keywords === 'string') {
    const keywordCount = metadata.keywords.split(',').length;
    if (keywordCount > 15) {
      issues.push('Too many keywords (>15)');
      const keywords = metadata.keywords.split(',').slice(0, 15);
      optimizedMetadata.keywords = keywords.join(', ');
    }
  }
  
  // Ensure robots are properly configured
  if (!metadata.robots) {
    optimizedMetadata.robots = {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    };
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    optimizedMetadata,
  };
}

/**
 * Generates sitemap-ready metadata for dynamic content
 */
export function generateSitemapMetadata(options: {
  url: string;
  lastModified?: Date;
  changeFrequency?: string;
  priority?: number;
  alternateLanguages?: Record<string, string>;
}) {
  const { url, lastModified, changeFrequency = 'weekly', priority = 0.5, alternateLanguages } = options;
  
  return {
    url: `${BASE_URL}${url}`,
    lastModified: lastModified || new Date(),
    changeFrequency,
    priority: Math.max(0, Math.min(1, priority)), // Ensure 0-1 range
    alternateLanguages: alternateLanguages || {},
  };
}
