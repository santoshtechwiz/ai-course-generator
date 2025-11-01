/**
 * CourseAI SEO Configuration
 * Centralized configuration management with environment-aware settings
 */

import type { SEOConfig } from '../core/seo-service'

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

const getEnvironmentConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'

  return {
    isProduction,
    isDevelopment,
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://courseai.io',
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'CourseAI',
    siteDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
      'AI-powered educational platform for creating interactive courses and intelligent quizzes',
    twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || '@courseai',
    defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en_US',
    supportedLocales: (process.env.NEXT_PUBLIC_SUPPORTED_LOCALES || 'en_US').split(','),
  }
}

// ============================================================================
// BASE SEO CONFIGURATION
// ============================================================================

export const baseSEOConfig: SEOConfig = {
  title: 'CourseAI - AI-Powered Educational Platform',
  description: 'Create engaging courses and interactive quizzes with AI. CourseAI transforms text, videos, and ideas into comprehensive learning experiences. Perfect for educators, trainers, and content creators.',
  keywords: [
    'AI education platform',
    'course creation',
    'interactive learning',
    'quiz generator',
    'educational technology',
    'e-learning',
    'AI-powered courses',
    'video tutorials',
    'online education',
    'skill development',
    'professional training',
    'coding courses',
    'programming tutorials',
    'tech education',
    'personalized learning',
  ],
  type: 'website',
  openGraph: {
    siteName: 'CourseAI',
    locale: 'en_US',
    type: 'website',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'CourseAI - AI-Powered Educational Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@courseai',
    creator: '@courseai',
  },
  locale: 'en_US',
}

// ============================================================================
// PAGE-SPECIFIC CONFIGURATIONS
// ============================================================================

export const pageConfigs = {
  home: {
    title: 'CourseAI - AI-Powered Educational Platform',
    description: 'Create engaging courses and interactive quizzes with AI. Transform your ideas into comprehensive learning experiences.',
    type: 'website' as const,
  },

  features: {
    title: 'Features - CourseAI',
    description: 'Explore powerful AI features for course creation, interactive quizzes, progress tracking, and personalized learning.',
    keywords: ['AI features', 'course builder', 'quiz generator', 'progress tracking', 'personalized learning'],
  },

  pricing: {
    title: 'Pricing - CourseAI',
    description: 'Choose the perfect plan for your educational needs. Free tier available with premium features for advanced users.',
    keywords: ['pricing', 'subscription plans', 'free plan', 'premium features'],
  },

  about: {
    title: 'About Us - CourseAI',
    description: 'Learn about CourseAI\'s mission to revolutionize education through AI-powered learning tools and platforms.',
    type: 'article' as const,
  },

  contact: {
    title: 'Contact Us - CourseAI',
    description: 'Get in touch with the CourseAI team. We\'re here to help you create amazing learning experiences.',
  },

  privacy: {
    title: 'Privacy Policy - CourseAI',
    description: 'Learn how CourseAI protects your data and privacy. Comprehensive privacy policy for our educational platform.',
  },

  terms: {
    title: 'Terms of Service - CourseAI',
    description: 'Read CourseAI\'s terms of service and usage guidelines for our AI-powered educational platform.',
  },

  dashboard: {
    title: 'Dashboard - CourseAI',
    description: 'Access your CourseAI dashboard to manage courses, track progress, and create educational content.',
    noIndex: true, // Private dashboard
  },

  course: {
    title: 'Course - CourseAI',
    description: 'Access your interactive course with AI-generated content and personalized learning experience.',
    type: 'article' as const,
  },

  quiz: {
    title: 'Quiz - CourseAI',
    description: 'Take an interactive quiz with AI-powered questions and instant feedback.',
    type: 'article' as const,
  },
} as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get page-specific SEO configuration
 */
export function getPageConfig(pageKey: keyof typeof pageConfigs, overrides: Partial<SEOConfig> = {}): SEOConfig {
  const pageConfig = pageConfigs[pageKey]
  return { ...baseSEOConfig, ...pageConfig, ...overrides } as SEOConfig
}

/**
 * Generate dynamic course page config
 */
export function getCoursePageConfig(course: {
  title: string
  description?: string
  instructor?: string
  tags?: string[]
  image?: string
  url: string
}): SEOConfig {
  return {
    ...baseSEOConfig,
    title: course.title,
    description: course.description || `Learn ${course.title} with AI-powered interactive content.`,
    author: course.instructor,
    tags: course.tags,
    image: course.image,
    url: course.url,
    type: 'article',
    openGraph: {
      ...baseSEOConfig.openGraph,
      type: 'article',
      images: course.image ? [{
        url: course.image,
        width: 1200,
        height: 630,
        alt: course.title,
      }] : baseSEOConfig.openGraph?.images,
    },
  }
}

/**
 * Generate dynamic quiz page config
 */
export function getQuizPageConfig(quiz: {
  title: string
  description?: string
  category?: string
  difficulty?: string
  image?: string
  url: string
}): SEOConfig {
  return {
    ...baseSEOConfig,
    title: quiz.title,
    description: quiz.description || `Test your knowledge with this ${quiz.category} quiz.`,
    section: quiz.category,
    tags: [quiz.category, quiz.difficulty].filter((item): item is string => Boolean(item)),
    image: quiz.image,
    url: quiz.url,
    type: 'article',
    openGraph: {
      ...baseSEOConfig.openGraph,
      type: 'article',
      images: quiz.image ? [{
        url: quiz.image,
        width: 1200,
        height: 630,
        alt: quiz.title,
      }] : baseSEOConfig.openGraph?.images,
    },
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate image URL and dimensions
 */
export function validateImage(image: { url: string; width?: number; height?: number }): boolean {
  if (!isValidUrl(image.url)) return false
  if (image.width && image.width < 200) return false
  if (image.height && image.height < 200) return false
  return true
}

/**
 * Check if configuration has required fields
 */
export function hasRequiredFields(config: SEOConfig): boolean {
  return Boolean(config.title && config.description && config.url)
}