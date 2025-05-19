"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchQuizResults } from '@/app/store/slices/textQuizSlice'
import QuizDetailsPageWithContext from '../../../components/QuizDetailsPageWithContext'
import QuizResultsOpenEnded from '../../components/QuizResultsOpenEnded'

export default function OpenEndedQuizResultsPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { answers, status, error, quizData } = useAppSelector((state) => state.textQuiz)

  useEffect(() => {
    if (params.slug) {
      dispatch(fetchQuizResults({ slug: params.slug, type: 'openended' }))
    }
  }, [dispatch, params.slug])

  if (status === 'loading') {
    return <div className="text-center p-4">Loading results...</div>
  }

  if (status === 'failed') {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>
  }

  if (!quizData) {
    router.push('/dashboard')
    return null
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  const breadcrumbItems = [
    { name: "Home", href: baseUrl },
    { name: "Dashboard", href: `${baseUrl}/dashboard` },
    { name: "Open-ended", href: `${baseUrl}/dashboard/openended` },
    { name: quizData.title, href: `${baseUrl}/dashboard/openended/${params.slug}` },
    { name: "Results", href: `${baseUrl}/dashboard/openended/${params.slug}/results` },
  ]

  return (
    <QuizDetailsPageWithContext
      title={`${quizData.title} Results`}
      description="Review your answers and performance"
      slug={params.slug}
      quizType="openended"
      questionCount={quizData.questions.length}
      estimatedTime="PT0M"
      breadcrumbItems={breadcrumbItems}
      quizId={quizData.id}
      authorId={quizData.userId}
      isPublic={false}
      isFavorite={false}
    >
      <QuizResultsOpenEnded
        result={{
          quizId: quizData.id,
          slug: params.slug,
          title: quizData.title,
          answers: answers,
          questions: quizData.questions,
          totalQuestions: quizData.questions.length,
          score: 0,
          completedAt: new Date().toISOString(),
        }}
      />
    </QuizDetailsPageWithContext>
  )
}
