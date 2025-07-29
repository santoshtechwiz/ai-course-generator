// --- Zod schema for quiz question requests (migrated from schema/schema.ts) ---
import { z } from "zod";

export const getQuestionsSchema = z.object({
  title: z.string(),
  amount: z.number().int().positive().min(1).max(20),
  type: z.enum(["mcq"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
});
import { Metadata } from 'next';
import { SocialImageProps, BreadcrumbItem } from './types';

/**
 * SEO Manager - Utility functions
 * 
 * This file contains utility functions for SEO tasks such as 
 * generating descriptions, extracting keywords, and more.
 */

/**
 * Extracts keywords from content text
 * @param content The text content to extract keywords from
 * @param limit Maximum number of keywords to return
 * @returns Array of keywords
 */
export function extractKeywords(content: string, limit: number = 10): string[] {
  // Common English stopwords to filter out
  const stopwords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 
    'being', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'of', 'that', 
    'this', 'these', 'those', 'it', 'its'
  ]);
  
  // Clean and split the content into words
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && !stopwords.has(word) && !Number.isNaN(Number(word))
    );
  
  // Count occurrences of each word
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });
  
  // Sort by frequency and return top keywords
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Generates a meta description from content text
 * @param content The text content to generate description from
 * @param maxLength Maximum length of the description
 * @returns Formatted meta description
 */
export function generateMetaDescription(content: string, maxLength: number = 160): string {
  // Remove HTML tags, extra spaces, and normalize
  const cleanText = content
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  // Truncate to maxLength and add ellipsis if needed
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  
  // Try to truncate at a sentence or period
  const truncated = cleanText.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  
  if (lastPeriod > maxLength * 0.7) {
    // If we found a good sentence break
    return truncated.substring(0, lastPeriod + 1);
  }
  
  // Otherwise try to truncate at a word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.substring(0, lastSpace) + '...';
}

/**
 * Optimizes alt text for images
 * @param alt Current alt text
 * @param fallback Fallback text if alt is empty
 * @returns Optimized alt text
 */
export function optimizeImageAlt(alt: string | undefined | null, fallback: string): string {
  if (!alt) return fallback;
  
  // Remove redundant phrases
  const cleanAlt = alt
    .replace(/^(image|picture|photo) of /i, '')
    .replace(/^(showing|displaying) /i, '');
  
  // Return cleaned alt text or fallback
  return cleanAlt || fallback;
}

/**
 * Generates JSON-LD structured data
 * @param type The type of structured data
 * @param data The data to include in the structured data
 * @returns JSON-LD structured data object
 */
export function generateJsonLd(type: string, data: Record<string, any>) {
  const baseStructure = {
    '@context': 'https://schema.org',
    '@type': type.charAt(0).toUpperCase() + type.slice(1),
    ...data
  };
  
  return baseStructure;
}

/**
 * Social image helper - creates OG image URL from title/description or uses provided image
 * @param title Content title
 * @param description Content description
 * @param imagePath Custom image path
 * @returns Fully qualified image URL
 */
export function getSocialImageUrl(
  title: string, 
  description?: string, 
  imagePath?: string
): string {
  if (imagePath) {
    // If a custom image is provided, use it
    return imagePath.startsWith('http') ? imagePath : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${imagePath}`;
  }
  
  // Otherwise, use OG image generator with title and description
  const params = new URLSearchParams();
  params.append('title', title);
  if (description) params.append('description', description);
  
  return `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/og?${params.toString()}`;
}

/**
 * Generate breadcrumb items from URL path
 * @param path URL path
 * @returns Array of breadcrumb items
 */
export function generateBreadcrumbItemsFromPath(path: string): BreadcrumbItem[] {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io";
  const segments = path.split("/").filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [{ name: "Home", position: 1, url: baseUrl }];

  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    
    const name = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    breadcrumbs.push({
      position: i + 2, // +2 because Home is position 1
      name,
      url: `${baseUrl}${currentPath}`,
    });
  }

  return breadcrumbs;
}

/**
 * Create breadcrumb items for schema.org structured data
 * @param paths Array of path segments
 * @param baseUrl Base URL of the site
 * @returns Array of formatted breadcrumb items
 */
export function createBreadcrumbItems(
  paths: { name: string; path: string }[],
  baseUrl = 'https://courseai.io'
): BreadcrumbItem[] {
  return paths.map((item, index) => ({
    position: index + 1,
    name: item.name,
    url: item.path.startsWith('http') ? item.path : `${baseUrl}${item.path}`
  }));
}

/**
 * Create social media profile URLs for Organization schema
 * @param profiles Object containing social media handles
 * @returns Array of formatted social media URLs
 */
export function createSocialProfiles(profiles: {
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
  youtube?: string;
  instagram?: string;
}): string[] {
  const socialProfiles = [];

  if (profiles.twitter) {
    socialProfiles.push(`https://twitter.com/${profiles.twitter}`);
  }
  if (profiles.facebook) {
    socialProfiles.push(`https://facebook.com/${profiles.facebook}`);
  }
  if (profiles.linkedin) {
    socialProfiles.push(`https://linkedin.com/company/${profiles.linkedin}`);
  }
  if (profiles.github) {
    socialProfiles.push(`https://github.com/${profiles.github}`);
  }
  if (profiles.youtube) {
    socialProfiles.push(`https://youtube.com/c/${profiles.youtube}`);
  }
  if (profiles.instagram) {
    socialProfiles.push(`https://instagram.com/${profiles.instagram}`);
  }

  return socialProfiles;
}

/**
 * Generates consistent social media metadata for pages
 * @param props Properties for social media metadata
 * @returns Metadata object for Next.js metadata
 */
export function generateSocialImage({
  title = 'CourseAI - Interactive Programming Quizzes and Learning',
  description = 'Enhance your programming skills with interactive quizzes, coding challenges, and learning resources designed for developers of all levels.',
  imagePath = '/images/og/courseai-og.png',
  url = '',
  type = 'website'
}: SocialImageProps): Partial<Metadata> {
  // Use the default OG image or a specified one
  const imageUrl = imagePath || '/images/og/courseai-og.png';
  
  return {
    openGraph: {
      title,
      description,
      url: url || 'https://courseai.io',
      siteName: 'CourseAI',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title
        }
      ],
      type
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@courseai'
    }
  };
}
