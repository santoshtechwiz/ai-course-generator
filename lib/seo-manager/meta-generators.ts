/**
 * Core metadata generation functions
 */
import { Metadata } from 'next';
import { MetadataOptions } from './structured-data/types';
import { defaultMetadata, BASE_URL } from './config';
import { extractKeywords, generateMetaDescription, getQuizTypeLabel } from './helper-utils';
import { generateSocialImage } from './social-image';

export { generateSocialImage };
export { defaultMetadata };

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

  const baseUrl = BASE_URL;
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
    // Handle both string and object formats for ogImage
    let ogImageUrl: string;
    
    if (typeof ogImage === 'string') {
      // If ogImage is a string, use it directly
      ogImageUrl = ogImage.startsWith('http') ? ogImage : new URL(ogImage, baseUrl).toString();
    } else if (ogImage.url) {
      // If ogImage is an object with url property
      ogImageUrl = ogImage.url.startsWith('http') ? ogImage.url : new URL(ogImage.url, baseUrl).toString();
    } else {
      // Fallback to a default image
      ogImageUrl = new URL('/images/og-image.jpg', baseUrl).toString();
    }
    
    metadata.openGraph = {
      ...defaultMetadata.openGraph,
      ...(title && { title }),
      ...(description && { description }),
      ...(ogType && { type: ogType }),
      images: [{
        url: ogImageUrl,
        alt: typeof ogImage === 'object' ? ogImage.alt || (title || 'Page image') : (title || 'Page image'),
        width: typeof ogImage === 'object' ? ogImage.width || 1200 : 1200,
        height: typeof ogImage === 'object' ? ogImage.height || 630 : 630,
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
 * Specialized function for generating metadata for quiz pages
 */
export function generateQuizMetadata(quiz: any, slug: string): Metadata {
  if (!quiz) {
    return generateMetadata({
      title: "Quiz Not Found",
      description: "The requested quiz could not be found.",
      noIndex: true,
    });
  }

  const quizTypeLabel = getQuizTypeLabel(quiz.quizType);
  const questionCount = quiz.questions?.length || 0;

  const title = `${quiz.title} ${quizTypeLabel} Quiz`;
  const description = `Test your knowledge with this ${quiz.title} ${quizTypeLabel} quiz${
    quiz.user?.name ? ` created by ${quiz.user.name}` : ""
  }. Challenge yourself with ${questionCount} questions and learn something new!`;

  // Keywords for better SEO
  const keywords = [
    quiz.title, 
    quizTypeLabel, 
    "quiz", 
    "learning", 
    "education", 
    "test", 
    "assessment",
    `${quiz.title.toLowerCase()} test`,
    `${quiz.title.toLowerCase()} assessment`,
    `${quiz.title.toLowerCase()} ${quizTypeLabel.toLowerCase()}`,
    `practice ${quiz.title.toLowerCase()}`
  ];

  return generateMetadata({
    title,
    description,
    path: `/quiz/${slug}`,
    keywords,
    ogImage: `/api/og?title=${encodeURIComponent(quiz.title)}&type=${quiz.quizType}`,
    ogType: "website",
    structuredData: {
      "@type": "Quiz",
      name: title,
      description: description,
      educationalAlignment: {
        "@type": "AlignmentObject",
        alignmentType: "educationalSubject",
        targetName: "Learning Assessment",
      },
      learningResourceType: quizTypeLabel,
      numberOfQuestions: questionCount,
      creator: quiz.user?.name ? {
        "@type": "Person",
        name: quiz.user.name,
      } : undefined,
    }
  });
}

/**
 * Specialized metadata generator for course pages
 */
export function generateCourseMetadata(course: any, slug: string): Metadata {
  if (!course) {
    return generateMetadata({
      title: "Course Not Found | CourseAI",
      description: "The requested programming course could not be found. Explore our other coding education resources.",
      path: `/dashboard/course/${slug}`,
      noIndex: true,
    });
  }

  // Extract keywords from course content
  const contentKeywords = course.description ? extractKeywords(course.description, 5) : [];

  // Extract keywords from course title and category
  const courseKeywords = course.title?.toLowerCase().split(" ") || [];
  const categoryKeyword = course.category?.name?.toLowerCase() || "";

  // Create a more detailed description
  const enhancedDescription = course.description
    ? generateMetaDescription(course.description, 160)
    : `Master ${course.title} with our interactive coding course. Learn through AI-generated practice questions, hands-on exercises, and expert guidance. Perfect for ${course.difficulty || "all"} level developers.`;

  // Safely handle course image URL
  let ogImage = course.image || `/api/og?title=${encodeURIComponent(course.title || '')}&description=${encodeURIComponent("Interactive Programming Course")}`;
  
  return generateMetadata({
    title: `${course.title} Programming Course | Learn with AI`,
    description: enhancedDescription,
    path: `/dashboard/course/${slug}`,
    keywords: [
      `${course.title?.toLowerCase()} tutorial`,
      `${course.title?.toLowerCase()} programming`,
      `learn ${course.title?.toLowerCase()}`,
      `${course.title?.toLowerCase()} course`,
      `${categoryKeyword} programming`,
      "coding education",
      "interactive programming",
      "AI learning",
      "developer skills",
      ...contentKeywords,
      ...courseKeywords.filter((k: string) => k.length > 3).map((k: string) => `${k} programming`),
    ],
    ogImage,
    ogType: "article",
  });
}
