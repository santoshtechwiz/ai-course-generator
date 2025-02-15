"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { notFound } from "next/navigation"
import CodingQuiz from "./CodeQuiz"
import type { CodingQuizProps } from "@/app/types/types"


import SectionWrapper from "@/components/SectionWrapper"
import { QuizActions } from "@/app/components/QuizActions"
import PageLoader from "@/components/ui/loader"

async function getQuizData(slug: string): Promise<CodingQuizProps | null> {
  try {
    const response = await axios.get<CodingQuizProps>(`/api/code/${slug}`)
    if (response.status !== 200) {
      throw new Error("Failed to fetch quiz data")
    }
    return response.data
  } catch (error) {
    console.error("Error fetching quiz data:", error)
    return null
  }
}

interface CodingQuizWrapperProps {
  slug: string
  userId: string
}

export default function CodeQuizWrapper({ slug, userId }: CodingQuizWrapperProps) {
  const {
    data: quizData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["quizData", slug],
    queryFn: () => getQuizData(slug),
  })

  if (isLoading) {
    return <PageLoader />
  }

  if (isError || !quizData) {
    return notFound()
  }

  return (

    <div className="flex flex-col gap-4 p-4 ">
     
        <QuizActions
          quizId={quizData.quizId.toString()}
          quizSlug={quizData.slug}
          initialIsPublic={false}
          initialIsFavorite={false}
          userId={userId}
          ownerId={quizData?.ownerId || ""}
        />
   
        <CodingQuiz
          quizId={quizData.quizId}
          slug={quizData.slug}
          isFavorite={quizData.isFavorite}
          isPublic={quizData.isPublic}
          userId={userId}
          ownerId={quizData?.ownerId || ""}
          quizData={quizData.quizData}
        />
     
    </div>

  )
}

