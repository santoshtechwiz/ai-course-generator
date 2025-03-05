"use client"

import { useState } from "react"
import { QuizWrapper } from "@/components/QuizWrapper"
import AnimatedQuizHighlight from "@/components/RanomQuiz"

export default function QuizPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Coding Quiz Generator</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <QuizWrapper type="code" />
        </div>
        <div className="lg:w-1/3">
          <AnimatedQuizHighlight />
        </div>
      </div>
    </div>
  )
}

