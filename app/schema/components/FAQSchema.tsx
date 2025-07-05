import React from 'react';

/**
 * FAQ Schema for the CourseAI platform
 * This component renders JSON-LD structured data for FAQs
 */
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

export default function FAQSchema({ items }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Default FAQ items for CourseAI
 */
export const defaultFAQItems: FAQItem[] = [
  {
    question: 'What is CourseAI?',
    answer: 'CourseAI is an AI-powered platform for interactive coding education. It provides personalized learning through quizzes, flashcards, and comprehensive courses.'
  },
  {
    question: 'How do the flashcards work?',
    answer: 'Our flashcards use spaced repetition and active recall to help you memorize key programming concepts. You can create your own cards or use our AI-generated ones.'
  },
  {
    question: 'Is CourseAI suitable for beginners?',
    answer: 'Absolutely! CourseAI offers content for all skill levels, from complete beginners to advanced developers. Our AI tailors the learning experience to your current knowledge.'
  },
  {
    question: 'Can I track my learning progress?',
    answer: 'Yes, CourseAI provides detailed analytics and progress tracking for all your learning activities. You can see your strengths, areas for improvement, and overall progress.'
  },
  {
    question: 'How do I create custom quizzes?',
    answer: 'Navigate to the quiz creation page, enter your topic of interest, select the quiz type (multiple choice, flashcard, code, etc.), and our AI will generate custom questions for you.'
  },
  {
    question: 'What programming languages are covered?',
    answer: 'CourseAI covers most popular programming languages including JavaScript, Python, Java, TypeScript, C++, Ruby, Go, and many more. New languages are regularly added.'
  }
];
