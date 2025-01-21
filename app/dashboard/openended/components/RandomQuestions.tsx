'use client'


import React from 'react'

import { QuizCard } from '@/app/components/shared/QuizCard'

interface RandomQuestion {
  topic: string
  slug: string
  description: string
  imageUrl?: string,
  count: number,
}

interface RandomQuestionsProps {
  questions: RandomQuestion[]
}

export default function RandomQuestions({ questions }: RandomQuestionsProps) {
  console.log('questions', questions);
  return (
   
    <>
      {questions.map((question) => (

        <QuizCard
          key={question.slug}
          title={question.topic}
          description={question.description}
          difficulty="Easy"
          questionCount={question.count}
          isTrending={true}
          slug={question.slug}
          quizType="open-ended" estimatedTime={''} />
      ))}

    </>

  )
}

