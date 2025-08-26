"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { QuizLoading } from "./QuizLoading"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"

const QuizzesClient = dynamic(() => import("./QuizzesClient"), {
  loading: () => <QuizLoading />,
  ssr: false
})

export default function QuizzesClientClient(props: any) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<QuizLoading />}>
        <QuizzesClient {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}
