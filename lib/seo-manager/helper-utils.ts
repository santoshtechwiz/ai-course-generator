/**
 * SEO utility functions (merged: helper-utils.ts + seo-utils.ts)
 * This is now the single source for all SEO utilities and structured data generators.
 */
import type { Metadata } from "next";
import { BreadcrumbItem } from './types';
import { BASE_URL, defaultSiteInfo, defaultMetadata } from './config';


/**
 * Extracts keywords from content text
 * @param content The text content to extract keywords from
 * @param limit Maximum number of keywords to return
 * @returns Array of keywords
 */
export function extractKeywords(content: string, limit: number = 10): string[] {
  const stopwords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'of', 'that',
    'this', 'these', 'those', 'it', 'its'
  ]);
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopwords.has(word) && isNaN(Number(word)));
  const wordFrequency: Record<string, number> = {};
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  return Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(entry => entry[0]);
}

/**
 * Generates a meta description from content text
 */
export function generateMetaDescription(content: string, maxLength: number = 160): string {
  if (!content || content.length === 0) return '';
  const cleanContent = content
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleanContent.length <= maxLength) return cleanContent;
  const truncateIndices = [
    cleanContent.lastIndexOf('. ', maxLength - 3),
    cleanContent.lastIndexOf('? ', maxLength - 3),
    cleanContent.lastIndexOf('! ', maxLength - 3),
    cleanContent.lastIndexOf(', ', maxLength - 3),
    cleanContent.lastIndexOf(' ', maxLength - 3)
  ].filter(index => index > 0);
  const truncateIndex = truncateIndices.length > 0
    ? Math.max(...truncateIndices) + 1
    : maxLength - 3;
  return cleanContent.substring(0, truncateIndex) + '...';
}

/**
 * Optimizes alt text for images
 */
export function optimizeImageAlt(alt: string | undefined | null, fallback: string): string {
  if (!alt) return fallback;
  return alt
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(image|picture|photo|screenshot) of /i, '')
    .replace(/^(showing|displaying) /i, '');
}

/**
 * Generates JSON-LD structured data
 */
export function generateJsonLd(type: string, data: Record<string, any>) {
  return {
    '@context': 'https://schema.org',
    '@type': type.charAt(0).toUpperCase() + type.slice(1),
    ...data
  };
}

/**
 * Social image helper - creates OG image URL from title/description or uses provided image
 */
export function getSocialImageUrl(
  title: string,
  description?: string,
  imagePath?: string
): string {
  if (imagePath?.startsWith('http')) {
    return imagePath;
  } else if (imagePath) {
    return `${BASE_URL}${imagePath}`;
  }
  return `${BASE_URL}/api/og?title=${encodeURIComponent(title)}$${
    description ? `&description=${encodeURIComponent(description.substring(0, 100))}` : ''
  }`;
}

/**
 * Create breadcrumb items for schema.org structured data
 */
export function createBreadcrumbItems(
  paths: { name: string; path: string }[],
  baseUrl = BASE_URL
): BreadcrumbItem[] {
  return paths.map((item, index) => ({
    position: index + 1,
    name: item.name,
    url: item.path.startsWith('http') ? item.path : `${baseUrl}${item.path}`
  }));
}

/**
 * Generate dynamic breadcrumb items based on the current path
 */
export function generateBreadcrumbs(currentPath: string, siteUrl = BASE_URL): BreadcrumbItem[] {
  const cleanPath = currentPath.replace(/^\/+|\/+$/g, '');
  const segments = cleanPath.split('/');
  const breadcrumbs = [
    { position: 1, name: 'Home', url: '/' }
  ];
  let currentUrl = '';
  segments.forEach((segment, index) => {
    currentUrl += `/${segment}`;
    const name = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    breadcrumbs.push({
      position: index + 2,
      name,
      url: currentUrl
    });
  });
  return breadcrumbs;
}

/**
 * Create social media profile URLs for Organization schema
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
  if (profiles.twitter) socialProfiles.push(`https://twitter.com/${profiles.twitter}`);
  if (profiles.facebook) socialProfiles.push(`https://facebook.com/${profiles.facebook}`);
  if (profiles.linkedin) socialProfiles.push(`https://linkedin.com/company/${profiles.linkedin}`);
  if (profiles.github) socialProfiles.push(`https://github.com/${profiles.github}`);
  if (profiles.youtube) socialProfiles.push(`https://youtube.com/c/${profiles.youtube}`);
  if (profiles.instagram) socialProfiles.push(`https://instagram.com/${profiles.instagram}`);
  return socialProfiles;
}

/**
 * Helper function to get a user-friendly quiz type label
 */
export function getQuizTypeLabel(quizType?: string): string {
  switch (quizType?.toLowerCase()) {
    case 'mcq':
      return 'Multiple Choice';
    case 'open':
      return 'Open-Ended';
    case 'fill-in-blank':
    case 'fillinblank':
      return 'Fill-in-the-Blank';
    case 'coding':
      return 'Coding';
    default:
      return quizType || 'Practice';
  }
}

// --- SEO Metadata Generation ---
interface SeoOptions {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  type?: "website" | "article" | "profile" | "course";
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
  noIndex?: boolean;
}

export function generateSeoMetadata(options: SeoOptions): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    type = "website",
    publishedAt,
    updatedAt,
    author,
    noIndex = false,
  } = options;

  const websiteUrl = BASE_URL;
  const defaultImage = `${websiteUrl}/api/og?title=${encodeURIComponent(title)}`;
  const imageUrl = image || defaultImage;

  // Map 'course' to 'website' for OpenGraph type
  const ogType = type === 'course' ? 'website' : type;

  return {
    title,
    description,
    keywords: keywords.join(", "),
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: ogType,
      url: websiteUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${title} | ${defaultSiteInfo.name}`,
        },
      ],
      siteName: defaultSiteInfo.name,
      publishedTime: publishedAt,
      modifiedTime: updatedAt,
      authors: author ? [author] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: "@courseai",
    },
    alternates: {
      canonical: websiteUrl,
    },
  };
}

// --- Structured Data Generators ---
export function generateCourseStructuredData(course: any) {
  const websiteUrl = BASE_URL;
  // Always include offers and hasCourseInstance, even if empty
  const offers = course.offers || [{
    "@type": "Offer",
    url: `${websiteUrl}/dashboard/course/${course.slug}`,
    price: course.price || 0,
    priceCurrency: course.priceCurrency || "USD",
    availability: "https://schema.org/InStock",
  }];
  const hasCourseInstance = course.hasCourseInstance || [];

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description || defaultMetadata.description,
    provider: {
      "@type": "Organization",
      name: defaultSiteInfo.name,
      sameAs: websiteUrl,
    },
    url: `${websiteUrl}/dashboard/course/${course.slug}`,
    image: course.image || `${websiteUrl}/api/og?title=${encodeURIComponent(course.title)}`,
    educationalLevel: course.difficulty || undefined,
    timeRequired: course.estimatedHours ? `PT${course.estimatedHours}H` : undefined,
    about: course.category?.name ? {
      "@type": "Thing",
      name: course.category.name,
    } : undefined,
    offers,
    hasCourseInstance,
  };
}

export function generateQuizStructuredData(quiz: any) {
  const websiteUrl = BASE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: quiz.title,
    description: quiz.description || defaultMetadata.description,
    url: `${websiteUrl}/dashboard/${quiz.quizType}/${quiz.slug}`,
    educationalUse: "Assessment",
    numberOfQuestions: quiz.questions?.length || 0,
    creator: quiz.author ? {
      "@type": "Person",
      name: quiz.author,
    } : undefined,
    dateCreated: quiz.createdAt || undefined,
    dateModified: quiz.updatedAt || undefined,
    image: quiz.image || `${websiteUrl}/api/og?title=${encodeURIComponent(quiz.title)}`,
  };
}
