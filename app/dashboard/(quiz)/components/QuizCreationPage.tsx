"use client"

import type React from "react"
import { motion } from "framer-motion"

import { BookOpen, Lightbulb, Brain } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import RandomQuote from "@/components/RandomQuote"
import QuizCourseWrapper from "./QuizCourseWrapper"
import { RandomQuiz } from "./layouts/RandomQuiz"
import { JsonLD } from "@/lib/seo";


export default function QuizCreationPage({
  type,
  title,
  metadata,
  schemas,
}: {
  type: "mcq" | "openended" | "fill-in-the-blanks" | "code" | "flashcard"
  title: string
  metadata: {
    creativeWorkSchema: any
    breadcrumbSchema: any
  }
  schemas?: React.ReactNode
}) {
  const quizTypeLabels = {
    mcq: "Multiple Choice Quiz",
    "fill-in-the-blanks": "Fill in the Blanks Quiz",
    openended: "Open-Ended Questions",
    code: "Code Challenge",
    flashcard: "Flashcard Set",
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  }

  return (
    <motion.div
      className="w-full px-3 sm:px-4 md:px-6 lg:container lg:mx-auto py-6 md:py-10 space-y-6 md:space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {schemas}
      <JsonLD type="CreativeWork" data={metadata.creativeWorkSchema} />
      <JsonLD type="BreadcrumbList" data={metadata.breadcrumbSchema} />

      <div className="grid grid-cols-1 gap-5 md:gap-6 lg:gap-8">
        {/* Compact RandomQuote */}
        <motion.div variants={itemVariants}>
          <RandomQuote />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
          <motion.div className="lg:col-span-2 relative group" variants={itemVariants}>
            <div className="absolute inset-0 bg-black border-4 border-black rounded-lg -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
            <div className="relative bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg overflow-hidden h-full">
              <div className="pb-3 md:pb-4 border-b-4 border-black bg-black p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-white border-2 border-black p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-black" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white">Create a New {title}</h2>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          className="flex items-center text-sm text-black bg-yellow-300 px-3 py-1.5 rounded-full self-start sm:self-auto border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6, duration: 0.3 }}
                        >
                          <Lightbulb className="h-4 w-4 mr-1.5 text-black" />
                          Pro tip: Be specific with your topic
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Specific topics lead to better quiz questions and more accurate results.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="mt-2 text-sm md:text-base text-muted-foreground">
                  Create a custom {quizTypeLabels[type]} to test knowledge or prepare for exams.
                </p>
              </div>
              <div className="p-4 md:p-6">
                <QuizCourseWrapper type={type} />
              </div>
            </div>
          </motion.div>

          <motion.div className="relative group" variants={itemVariants}>
            <div className="absolute inset-0 bg-black border-4 border-black rounded-lg -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
            <div className="relative bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg overflow-hidden h-full">
              <div className="pb-3 border-b-4 border-black bg-black p-4 md:p-5">
                <div className="flex items-center gap-2">
                  <div className="bg-white border-2 border-black p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Brain className="h-4 w-4 md:h-5 md:w-5 text-black" />
                  </div>
                  <h3 className="text-base md:text-lg font-black text-white">Discover Quizzes</h3>
                </div>
                <p className="mt-1 text-xs md:text-sm text-gray-300 font-bold">
                  Explore popular quizzes created by others
                </p>
              </div>
              <div>
                <RandomQuiz />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
