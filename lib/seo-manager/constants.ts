import { Metadata } from 'next';
import { FAQItem, SiteInfo } from './types';

/**
 * SEO Manager - Constants and defaults
 * 
 * This file contains default values and constants for the SEO Manager.
 * Centralizes all default settings for SEO-related functionality.
 */

/**
 * Default site information
 */
export const defaultSiteInfo: SiteInfo = {
  name: 'CourseAI',
  url: 'https://courseai.io',
  logoUrl: 'https://courseai.io/logo.png',
};

/**
 * Default metadata values to be used across the application
 */
export const defaultMetadata: Metadata = {
  title: {
    default: 'CourseAI - Interactive Programming Quizzes and Learning',
    template: '%s | CourseAI',
  },
  description: 'Enhance your programming skills with interactive quizzes, coding challenges, and learning resources designed for developers of all levels.',
  applicationName: 'CourseAI',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://courseai.io'),
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

/**
 * Default social media profiles
 */
export const defaultSocialProfiles: string[] = [
  'https://twitter.com/courseai',
  'https://github.com/courseai',
  'https://linkedin.com/company/courseai',
  'https://facebook.com/courseailearning'
];

/**
 * Default FAQ items for the site
 */
export const defaultFAQItems: FAQItem[] = [
  {
    question: 'What is CourseAI?',
    answer: 'CourseAI is an AI-powered platform for interactive learning, offering programming courses, quizzes, and educational tools to enhance your development skills.'
  },
  {
    question: 'Is CourseAI free to use?',
    answer: 'CourseAI offers both free and premium content. Many quizzes and resources are available at no cost, while premium courses and features require a subscription.'
  },
  {
    question: 'How do I create my own quiz or course?',
    answer: 'You can create custom quizzes and courses by logging in, navigating to the dashboard, and using our AI-powered content generation tools.'
  },
  {
    question: 'What programming languages are supported?',
    answer: 'CourseAI supports popular programming languages including JavaScript, TypeScript, Python, Java, C#, Ruby, Go, and many more.'
  },
  {
    question: 'Can I use CourseAI for my team or organization?',
    answer: 'Yes! CourseAI offers team plans for organizations looking to enhance their team\'s skills. Contact us for custom solutions for your team.'
  }
];
