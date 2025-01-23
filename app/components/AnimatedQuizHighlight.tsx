"use client"

import React from "react"
import { motion } from "framer-motion"
import { CheckCircle2, FileQuestion, AlignJustify, HelpCircle } from "lucide-react"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

function getQuizTypeRoute(quizType: string): string {
  switch (quizType) {
    case "mcq":
      return "mcq"
    case "open-ended":
      return "openended"
    case "fill-blanks":
      return "blanks"
    default:
      return "quiz"
  }
}

const iconMap = {
  mcq: CheckCircle2,
  "open-ended": FileQuestion,
  "fill-blanks": AlignJustify,
}

const difficultyColorMap = {
  Easy: "bg-green-500",
  Medium: "bg-yellow-500",
  Hard: "bg-red-500",
}

export const AnimatedQuizHighlight: React.FC = () => {
  const { quizzes, isLoading, error } = useRandomQuizzes(3)

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Featured Quizzes</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 animate-pulse h-24"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Featured Quizzes</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    )
  }

  const getQuizDifficulty = (quizType: string) => {
    switch (quizType) {
      case "mcq":
        return "Easy"
      case "open-ended":
      case "fill-blanks":
        return "Hard"
      default:
        return "Medium"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Featured Quizzes</h2>
      {quizzes.map((quiz, index) => (
        <>
        <Link href={`/${getQuizTypeRoute(quiz.quizType)}/${quiz.slug}`} key={quiz.id}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex items-center space-x-4 hover:shadow-md transition-shadow duration-300"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`rounded-full p-3 ${
                quiz.quizType === "mcq"
                  ? "bg-green-500"
                  : quiz.quizType === "open-ended"
                    ? "bg-red-500"
                    : "bg-yellow-500"
              }`}
            >
              {React.createElement(iconMap[quiz.quizType as keyof typeof iconMap] || HelpCircle, {
                className: "h-6 w-6 text-white",
              })}
            </motion.div>
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{quiz.topic}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">{quiz.quizType.replace("-", " ")}</p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  difficultyColorMap[getQuizDifficulty(quiz.quizType) as keyof typeof difficultyColorMap]
                }`}
              >
                {getQuizDifficulty(quiz.quizType)}
              </span>
              {quiz.bestScore && (
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Best: {quiz.bestScore}%</span>
              )}
            </div>
          </motion.div>
        </Link>
        <Separator></Separator>
        </>
      ))}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out mt-6"
      >
        Explore More Quizzes
      </motion.button>
    </motion.div>
  )
}

