import React from 'react';

interface CourseSchemaProps {
  courseName: string;
  courseUrl: string;
  description: string;
  provider?: string;
  providerUrl?: string;
  imageUrl?: string;
  dateCreated?: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
}

/**
 * Course Schema component for SEO
 * Use this on course pages
 */
export default function CourseSchema({
  courseName,
  courseUrl,
  description,
  provider = 'CourseAI',
  providerUrl = 'https://courseai.io',
  imageUrl,
  dateCreated = new Date().toISOString(),
  dateModified = new Date().toISOString(),
  authorName,
  authorUrl
}: CourseSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: courseName,
    description: description,
    url: courseUrl,
    provider: {
      '@type': 'Organization',
      name: provider,
      sameAs: providerUrl
    },
    ...(imageUrl && { image: imageUrl }),
    dateCreated,
    dateModified,
    ...(authorName && {
      author: {
        '@type': 'Person',
        name: authorName,
        ...(authorUrl && { url: authorUrl })
      }
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface QuizSchemaProps {
  quizName: string;
  quizUrl: string;
  description: string;
  numberOfQuestions?: number;
  timeRequired?: string; // ISO duration format (e.g., 'PT30M')
  educationalLevel?: string;
  provider?: string;
  providerUrl?: string;
}

/**
 * Quiz Schema component for SEO
 * Use this on quiz pages
 */
export function QuizSchema({
  quizName,
  quizUrl,
  description,
  numberOfQuestions,
  timeRequired,
  educationalLevel = 'Beginner',
  provider = 'CourseAI',
  providerUrl = 'https://courseai.io'
}: QuizSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: quizName,
    description: description,
    url: quizUrl,
    provider: {
      '@type': 'Organization',
      name: provider,
      sameAs: providerUrl
    },
    ...(numberOfQuestions && { numberOfQuestions }),
    ...(timeRequired && { timeRequired }),
    educationalLevel
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
