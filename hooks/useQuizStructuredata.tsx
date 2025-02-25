'use client'
import { QuizType } from '@/app/types/types';
import { useEffect } from 'react';


export interface QuizDetails {
  type: QuizType;
  name: string;
  description: string;
  author: string;
  datePublished: string;
  numberOfQuestions: number;
  timeRequired: string;
  educationalLevel: string;
}

export function useQuizStructuredData(quizDetails: QuizDetails) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Quiz',
      name: quizDetails.name,
      description: quizDetails.description,
      author: {
        '@type': 'Person',
        name: quizDetails.author,
      },
      datePublished: quizDetails.datePublished,
      educationalLevel: quizDetails.educationalLevel,
      timeRequired: quizDetails.timeRequired,
      numberOfQuestions: quizDetails.numberOfQuestions,
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [quizDetails]);
}

