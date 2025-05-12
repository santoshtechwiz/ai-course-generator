"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useInterval } from "@/hooks/useInterval"

const benefits = [
  {
    title: "Create Complete Courses Instantly",
    description:
      "Generate full-featured courses from any topic or video transcript with built-in MCQs, open-ended questions, fill-in-the-blanks, document uploads, PDF downloads, and AI-powered quizzes.",
    icon: "📚",
  },

  {
    title: "Custom Quiz Creation",
    description: "Easily design quizzes tailored to your content to reinforce learning effectively.",
    icon: "📝",
  },
  {
    title: "Multiple Question Types",
    description: "Support diverse learning with MCQs, open-ended, and fill-in-the-blank questions.",
    icon: "❓",
  },
  {
    title: "Progress Tracking",
    description: "Track learner performance and engagement through detailed progress analytics.",
    icon: "📊",
  },
  {
    title: "AI-Powered Content Generation",
    description: "Automatically generate course content and quizzes from transcripts using AI.",
    icon: "🤖",
  },
  {
    title: "Flexible Learning Paths",
    description: "Deliver personalized learning journeys based on user progress and preferences.",
    icon: "🛤️",
  },
]

export const BenefitsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = React.useState(0)

  useInterval(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % benefits.length)
  }, 5000)

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div className="max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
              className="text-6xl mb-4"
            >
              {benefits[currentIndex].icon}
            </motion.div>
            <h2 className="text-2xl font-bold mb-4">{benefits[currentIndex].title}</h2>
            <p className="text-lg opacity-90">{benefits[currentIndex].description}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
