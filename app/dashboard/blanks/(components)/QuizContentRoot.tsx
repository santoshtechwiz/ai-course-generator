"use client"

import { Suspense } from "react"
import { AnimatedQuizHighlight } from "@/app/components/AnimatedQuizHighlight"
import { QuizWrapper } from "@/components/QuizWrapper"

export function QuizContentRoot() {
  return (
    <div className="flex flex-wrap md:flex-nowrap gap-8">
      {/* Left Column - Fill in the Blank Form */}
      <div className="flex-grow bg-white dark:bg-gray-800 p-8 shadow rounded">
        <Suspense fallback={<div>Loading quiz...</div>}>
          <QuizWrapper type="fill-in-the-blanks" />
        </Suspense>
      </div>
      {/* Right Column - Highlight */}
      <div className="w-full md:w-96 bg-gray-200 dark:bg-gray-800 p-8 shadow rounded">
        <Suspense fallback={<div>Loading highlight...</div>}>
          <AnimatedQuizHighlight />
        </Suspense>
      </div>
    </div>
  )
}

