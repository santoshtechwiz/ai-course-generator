/**
 * SEO utility functions
 */
import { BreadcrumbItem } from './structured-data/types';
import { BASE_URL } from './config';

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
  
  // Count word frequency
  const wordFrequency: Record<string, number> = {};
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  
  // Sort by frequency and get the top 'limit' words
  return Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(entry => entry[0]);
}

/**
 * Generates a meta description from content text
 * @param content The text content to generate description from
 * @param maxLength Maximum length of the description
 * @returns Formatted meta description
 */
export function generateMetaDescription(content: string, maxLength: number = 160): string {
  if (!content || content.length === 0) {
    return '';
  }
  
  // Clean the content of excessive whitespace and HTML
  const cleanContent = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Replace multiple spaces with a single space
    .trim();
  
  // If the content is shorter than maxLength, return it directly
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  
  // Find a sensible point to truncate (at a period, comma, or space)
  const truncateIndices = [
    cleanContent.lastIndexOf('. ', maxLength - 3),
    cleanContent.lastIndexOf('? ', maxLength - 3),
    cleanContent.lastIndexOf('! ', maxLength - 3),
    cleanContent.lastIndexOf(', ', maxLength - 3),
    cleanContent.lastIndexOf(' ', maxLength - 3)
  ].filter(index => index > 0);
  
  // Use the latest sensible truncation point or fallback to hard truncation
  const truncateIndex = truncateIndices.length > 0
    ? Math.max(...truncateIndices) + 1
    : maxLength - 3;
  
  return cleanContent.substring(0, truncateIndex) + '...';
}

/**
 * Optimizes alt text for images
 * @param alt Current alt text
 * @param fallback Fallback text if alt is empty
 * @returns Optimized alt text
 */
export function optimizeImageAlt(alt: string | undefined | null, fallback: string): string {
  if (!alt) {
    return fallback;
  }
  
  // Clean and format the alt text
  return alt
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(image|picture|photo|screenshot) of /i, '')
    .replace(/^(showing|displaying) /i, '');
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
 * @param title Title for OG image
 * @param description Description for OG image
 * @param imagePath Optional custom image path
 * @returns Formatted OG image URL
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
  
  return `${BASE_URL}/api/og?title=${encodeURIComponent(title)}${
    description ? `&description=${encodeURIComponent(description.substring(0, 100))}` : ''
  }`;
}

/**
 * Create breadcrumb items for schema.org structured data
 * @param paths Array of path segments
 * @param baseUrl Base URL of the site
 * @returns Array of formatted breadcrumb items
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
 * @param currentPath Current URL path
 * @param siteUrl Base site URL
 * @returns Array of breadcrumb items
 */
export function generateBreadcrumbs(currentPath: string, siteUrl = BASE_URL): BreadcrumbItem[] {
  // Remove leading/trailing slashes and split path
  const cleanPath = currentPath.replace(/^\/|\/$/g, '');
  const segments = cleanPath.split('/');
  
  const breadcrumbs = [
    { position: 1, name: 'Home', url: '/' }
  ];
  
  // Build up the breadcrumb path
  let currentUrl = '';
  
  segments.forEach((segment, index) => {
    currentUrl += `/${segment}`;
    
    // Format the name to be more readable
    const name = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      position: index + 2, // +2 because we start with Home at position 1
      name,
      url: currentUrl
    });
  });
  
  return breadcrumbs;
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
