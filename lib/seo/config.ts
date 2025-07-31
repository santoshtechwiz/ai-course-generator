/**
 * Default configuration values for SEO
 */

import { Metadata } from 'next'; 
import { SiteInfo, FaqItem } from './types';

// Base URL for the site
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://courseai.io';

// Default site information for schema.org structured data
export const defaultSiteInfo: SiteInfo = { 
  name: 'CourseAI',
  url: BASE_URL,
  logoUrl: `${BASE_URL}/logo.png`,
};

// Default FAQ items for the CourseAI platform
export const defaultFAQItems: FaqItem[] = [ 
  {
    question: 'What is CourseAI?',
    answer: 'CourseAI is an AI-powered education platform that helps you learn programming concepts through interactive courses, quizzes, and flashcards.'
  },
  {
    question: 'How does CourseAI generate content?',
    answer: 'CourseAI uses advanced AI models to create personalized learning materials, including quizzes, flashcards, and course content based on your learning goals and preferences.'
  },
  {
    question: 'Is CourseAI free to use?',
    answer: 'CourseAI offers both free and premium plans. The free plan gives you access to basic features, while premium plans unlock advanced features like unlimited quizzes, AI-powered course generation, and more.'
  },
  {
    question: 'How can I track my progress?',
    answer: 'CourseAI provides a comprehensive dashboard that tracks your learning progress, completed courses, quiz scores, and areas that need improvement.'
  },
  {
    question: 'Can I create my own courses?',
    answer: 'Yes, CourseAI allows you to create custom courses on any programming topic. You can design the curriculum, add quizzes, and share your courses with others.'
  },
  {
    question: 'How do I get started with CourseAI?',
    answer: 'Simply create an account, choose a learning path or topic of interest, and start exploring our courses and quizzes. Our AI will personalize recommendations based on your goals and progress.'
  }
];

// Standard social media profiles for CourseAI
export const defaultSocialProfiles: string[] = [ 
  'https://twitter.com/courseai',
  'https://github.com/courseai',
  'https://linkedin.com/company/courseai',
  'https://facebook.com/courseailearning'
];

// Default metadata values to be used across the application
export const defaultMetadata: Metadata = { 
  title: {
    default: 'CourseAI - Interactive Programming Quizzes and Learning',
    template: '%s | CourseAI',
  },
  description: 'Enhance your programming skills with interactive quizzes, coding challenges, and learning resources designed for developers of all levels.',
  applicationName: 'CourseAI',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'CourseAI',
    images: [{
      url: '/images/og/courseai-og.png',
      width: 1200,
      height: 630,
      alt: 'CourseAI - Interactive Programming Learning Platform'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@courseai',
    images: ['/images/og/courseai-og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: '/',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || '',
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '',
    },
  },
};
