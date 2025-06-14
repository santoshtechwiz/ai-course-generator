import { Metadata } from 'next'

// Default metadata values to be used across the application
export const defaultMetadata: Metadata = {
  title: {
    default: 'AI Learning Platform',
    template: '%s | AI Learning Platform',
  },
  description: 'Learn AI concepts and techniques through interactive lessons and practical examples',
  applicationName: 'AI Learning Platform',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AI Learning Platform',
    images: [{
      url: '/images/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'AI Learning Platform'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@ailearning',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: '/',
  },
}

// Type definitions for metadata options
export interface MetadataOptions {
  title?: string;
  description?: string;
  canonicalPath?: string;
  path?: string; // Added for compatibility with generatePageMetadata
  ogImage?: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  ogType?: string; // Added for compatibility with generatePageMetadata
  noIndex?: boolean;
  additionalMetaTags?: Array<{ name: string; content: string }>;
  structuredData?: Record<string, any>;
  keywords?: string[]; // Added for compatibility with generatePageMetadata
}

/**
 * Generates metadata for specific pages based on provided options
 */
export function generateMetadata(options: MetadataOptions): Metadata {
  const {
    title,
    description,
    canonicalPath,
    path,
    ogImage,
    ogType,
    noIndex = false,
    structuredData,
    keywords,
  } = options;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';
  const canonical = canonicalPath ? new URL(canonicalPath, baseUrl) : path ? new URL(path, baseUrl) : undefined;
  
  const metadata: Metadata = {
    ...(title && { title: title }),
    ...(description && { description }),
    ...(keywords && { keywords }),
    alternates: {
      canonical: canonical?.toString(),
    },
  };
  
  // Override OpenGraph and Twitter card data if provided
  if (ogImage) {
    const ogImageUrl = new URL(ogImage.url.startsWith('http') ? ogImage.url : ogImage.url, baseUrl).toString();
    
    metadata.openGraph = {
      ...defaultMetadata.openGraph,
      ...(title && { title }),
      ...(description && { description }),
      ...(ogType && { type: ogType }),
      images: [{
        url: ogImageUrl,
        alt: ogImage.alt || (title || 'Page image'),
        width: ogImage.width || 1200,
        height: ogImage.height || 630,
      }],
    };
    
    metadata.twitter = {
      ...defaultMetadata.twitter,
      title,
      description,
      images: [ogImageUrl],
    };
  }
  
  // Handle noIndex pages
  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }
  
  // Add JSON-LD structured data if provided
  if (structuredData) {
    metadata.other = {
      ...metadata.other,
      structuredData: JSON.stringify(structuredData),
    };
  }
  
  return metadata;
}

/**
 * Alias for generateMetadata with backward compatibility for existing code
 */
export const generatePageMetadata = generateMetadata;

/**
 * Dynamic metadata generator for route segments
 */
export async function generateDynamicMetadata<T extends { params: Record<string, string> }>(
  props: T,
  fetchData: (params: T['params']) => Promise<MetadataOptions>
): Promise<Metadata> {
  try {
    const options = await fetchData(props.params);
    return generateMetadata(options);
  } catch (error) {
    console.error('Error generating metadata:', error);
    return defaultMetadata;
  }
}

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
  
  // Count word frequencies
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Sort by frequency and return top keywords
  return Object.entries(wordCounts)
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
  
  // Clean up alt text
  const cleanAlt = alt.trim();
  if (cleanAlt.length === 0) return fallback;
  
  // Add descriptive prefix if missing
  if (cleanAlt.length < 20 && !cleanAlt.toLowerCase().includes('image')) {
    return `Image of ${cleanAlt}`;
  }
  
  return cleanAlt;
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
