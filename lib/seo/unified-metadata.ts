/**
 * Unified Metadata Generator
 * Single source of truth for all metadata generation needs
 */

import type { Metadata } from "next";
import { BASE_URL, defaultSiteInfo, SEO_CONFIG } from "./constants";
import { extractKeywords, generateMetaDescription, getSocialImageUrl } from "./core-utils";

export interface MetadataConfig {
  title: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
  canonical?: string;
}

/**
 * Primary metadata generation function
 * Handles all common SEO metadata needs
 */
export function generateMetadata(config: MetadataConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    url,
    type = "website",
    author,
    publishedTime,
    modifiedTime,
    section,
    tags = [],
    noIndex = false,
    noFollow = false,
    canonical,
  } = config;

  // Generate title
  const fullTitle = title?.includes(defaultSiteInfo.name || '') 
    ? title 
    : `${title} | ${defaultSiteInfo.name || 'CourseAI'}`;

  // Generate description
  const metaDescription = description || 'AI-powered learning platform with interactive courses and quizzes';
  const optimizedDescription = generateMetaDescription(metaDescription, SEO_CONFIG.descriptionLimit);

  // Generate keywords
  const allKeywords = [
    ...keywords,
    ...extractKeywords(optimizedDescription, 5),
    ...tags,
  ].slice(0, SEO_CONFIG.keywordsLimit);

  // Generate images
  const socialImage = getSocialImageUrl(title, optimizedDescription, image);
  const images = [
    {
      url: socialImage,
      width: 1200,
      height: 630,
      alt: title,
    },
  ];

  // Base metadata
  const metadata: Metadata = {
    title: fullTitle,
    description: optimizedDescription,
    keywords: allKeywords.join(", "),
    authors: author ? [{ name: author }] : undefined,
    generator: defaultSiteInfo.name || 'CourseAI',
    applicationName: defaultSiteInfo.name || 'CourseAI',
    referrer: "origin-when-cross-origin",
    creator: defaultSiteInfo.name || 'CourseAI',
    publisher: defaultSiteInfo.name || 'CourseAI',
    robots: {
      index: !noIndex,
      follow: !noFollow,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type,
      locale: "en_US",
      url: url || BASE_URL,
      title: fullTitle,
      description: optimizedDescription,
      images,
      siteName: defaultSiteInfo.name || 'CourseAI',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: optimizedDescription,
      images: [socialImage],
    },
    alternates: {
      canonical: canonical || url || BASE_URL,
    },
  };

  return metadata;
}

/**
 * Generate metadata for courses
 */
export function generateCourseMetadata(course: {
  title: string;
  description?: string;
  slug: string;
  image?: string;
  difficulty?: string;
  category?: { name: string };
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}): Metadata {
  const title = `${course.title} - Online Course`;
  const description = course.description || `Learn ${course.title} with our comprehensive online course. ${course.difficulty ? `Suitable for ${course.difficulty} level learners.` : ''}`;
  
  return generateMetadata({
    title,
    description,
    url: `${BASE_URL}/dashboard/course/${course.slug}`,
    image: course.image,
    type: "article",
    author: course.author,
    publishedTime: course.createdAt,
    modifiedTime: course.updatedAt,
    section: course.category?.name,
    keywords: [
      course.title,
      "online course",
      "learning",
      ...(course.difficulty ? [course.difficulty] : []),
      ...(course.category ? [course.category.name] : []),
    ],
  });
}

/**
 * Generate metadata for quizzes
 */
export function generateQuizMetadata(quiz: {
  title: string;
  description?: string;
  slug: string;
  quizType?: string;
  difficulty?: string;
  questionsCount?: number;
  author?: string;
  createdAt?: string;
}): Metadata {
  const title = `${quiz.title} - ${quiz.quizType || 'Practice'} Quiz`;
  const description = quiz.description || `Test your knowledge with our ${quiz.title} quiz. ${quiz.questionsCount ? `${quiz.questionsCount} questions` : ''} ${quiz.difficulty ? `at ${quiz.difficulty} level` : ''}.`;
  
  return generateMetadata({
    title,
    description,
    url: `${BASE_URL}/dashboard/${quiz.quizType || 'quiz'}/${quiz.slug}`,
    type: "article",
    author: quiz.author,
    publishedTime: quiz.createdAt,
    keywords: [
      quiz.title,
      "quiz",
      "practice test",
      "assessment",
      ...(quiz.quizType ? [quiz.quizType] : []),
      ...(quiz.difficulty ? [quiz.difficulty] : []),
    ],
  });
}
