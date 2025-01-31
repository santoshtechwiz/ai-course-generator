"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import CodeQuizForm from "./components/CodeQuizForm"
import RanomQuiz from "@/app/components/RanomQuiz"


interface RandomQuiz {
  id: string
  title: string
  language: string
  difficulty: string
}

export default function QuizPage() {
  const [language, setLanguage] = useState("JavaScript")
  const [difficulty, setDifficulty] = useState(50) // Changed to number for slider
  const [loading, setLoading] = useState(false)
 
  const router = useRouter()

  

  const generateQuizzes = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, difficulty: getDifficultyLabel(difficulty) }),
      })
      const { slug } = await response.json()
      router.push(`/dashboard/code/${slug}`)
    } catch (error) {
      console.error("Failed to generate quizzes:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyLabel = (value: number) => {
    if (value <= 33) return "easy"
    if (value <= 66) return "medium"
    return "hard"
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Coding Quiz Generator</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <CodeQuizForm
            language={language}
            setLanguage={setLanguage}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            onGenerate={generateQuizzes}
            isGenerating={loading}
          />
        </div>
        <div className="lg:w-1/3">
          <RanomQuiz/>
        </div>
      </div>
    </div>
  )
}
