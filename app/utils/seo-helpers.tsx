import { CombinedSEOSchema } from './seo-schemas';

/**
 * Default FAQ items for the CourseAI platform
 */
export const defaultFAQItems = [
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

/**
 * Standard social media profiles for CourseAI
 */
export const socialProfiles = [
  'https://twitter.com/courseai',
  'https://github.com/courseai',
  'https://linkedin.com/company/courseai',
  'https://facebook.com/courseailearning'
];

/**
 * Generate dynamic breadcrumb items based on the current path
 * @param currentPath Current URL path
 * @param siteUrl Base site URL
 * @returns Array of breadcrumb items
 */
export function generateBreadcrumbs(currentPath: string, siteUrl = 'https://courseai.io') {
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
 * Default SEO component for all pages
 * Includes WebSite, BreadcrumbList, and Organization schemas
 */
interface DefaultSEOProps {
  currentPath?: string;
  includeFAQ?: boolean;
  customFAQItems?: Array<{ question: string; answer: string }>;
}

export function DefaultSEO({ currentPath = '/', includeFAQ = false, customFAQItems }: DefaultSEOProps) {
  const breadcrumbs = currentPath ? generateBreadcrumbs(currentPath) : undefined;
  
  return (
    <CombinedSEOSchema
      breadcrumbs={
        breadcrumbs ? { items: breadcrumbs } : true
      }
      organization={{
        sameAs: socialProfiles
      }}
      faq={
        includeFAQ ? {
          items: customFAQItems || defaultFAQItems
        } : undefined
      }
    />
  );
}
