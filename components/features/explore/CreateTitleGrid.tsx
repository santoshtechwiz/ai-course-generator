"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { FileQuestion, BookOpen, PenTool, AlignLeft, Code, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import useSubscriptionStore from "@/store/useSubscriptionStore"

interface CreateTileGridProps {
  icon: LucideIcon
  title: string
  description: string
  url: string
  index: number
  quotes: string[]
  color: string
  isPremium: boolean
}

const tiles = [
  {
    icon: FileQuestion,
    title: "AI-Powered MCQ Generator",
    description: "Create intelligent multiple-choice questions with AI assistance for adaptive learning experiences.",
    url: "/dashboard/quiz",
    color: "blue",
    quotes: [
      "Craft AI-generated MCQs that adapt to student performance!",
      "Design quizzes that evolve with each learner's progress.",
      "Leverage AI to create challenging yet fair multiple-choice questions.",
      "Automate your quiz creation process with intelligent algorithms.",
      "Enhance learning outcomes with AI-optimized MCQs.",
    ],
    isPremium: false,
  },
  // {
  //   icon: FileText,
  //   title: "Document-Based Quiz Generator",
  //   description: "Upload a document and let AI create a comprehensive quiz based on its content.",
  //   url: "/dashboard/document",
  //   color: "amber",
  //   quotes: [
  //     "Transform any document into an engaging quiz with AI!",
  //     "Quickly create assessments from textbooks, articles, or research papers.",
  //     "Let AI extract key concepts and generate relevant questions.",
  //     "Save time on quiz creation while ensuring comprehensive coverage.",
  //     "Adapt any written material into an interactive learning experience.",
  //   ],
  //   isPremium: false,
  // },
  {
    icon: PenTool,
    title: "AI Essay Question Creator",
    description:
      "Generate thought-provoking open-ended questions using AI to stimulate critical thinking and creativity.",
    url: "/dashboard/openended",
    color: "green",
    quotes: [
      "Inspire deep analysis with AI-crafted open-ended questions!",
      "Let AI help you create questions that spark innovative thinking.",
      "Generate essay prompts that challenge and engage learners.",
      "Harness AI to design questions that encourage unique perspectives.",
      "Create AI-powered prompts that adapt to various subject matters.",
    ],
    isPremium: true,
  },
  {
    icon: AlignLeft,
    title: "Smart Fill-in-the-Blanks",
    description:
      "Use AI to generate contextually relevant fill-in-the-blank exercises for enhanced vocabulary and comprehension.",
    url: "/dashboard/blanks",
    color: "pink",
    quotes: [
      "Let AI craft clever fill-in-the-blanks to boost engagement!",
      "Create adaptive exercises that grow with your students' skills.",
      "Generate context-aware blanks that challenge and educate.",
      "Use AI to identify key concepts for impactful learning.",
      "Design intelligent gap-filling activities with AI assistance.",
    ],
    isPremium: false,
  },
  {
    icon: BookOpen,
    title: "AI Course Builder",
    description:
      "Leverage AI to structure and create comprehensive courses with dynamic content and personalized learning paths.",
    url: "/dashboard/create",
    color: "purple",
    quotes: [
      "Build AI-powered courses that adapt to each learner!",
      "Create intelligent learning journeys with AI assistance.",
      "Design courses that evolve based on student performance.",
      "Let AI help you craft engaging and effective curriculum.",
      "Develop smart, interactive courses for the future of education.",
    ],
    isPremium: false,
  },
  {
    icon: Code,
    title: "AI Coding Challenge Creator",
    description:
      "Generate diverse coding challenges and quizzes using AI to test and improve programming skills across languages.",
    url: "/dashboard/code",
    color: "red",
    quotes: [
      "Create AI-generated coding challenges that adapt to skill levels!",
      "Design intelligent programming quizzes with AI assistance.",
      "Let AI craft coding problems that push logical boundaries.",
      "Generate language-specific challenges with AI precision.",
      "Develop adaptive coding tests that grow with your students.",
    ],
    isPremium: true,
  },
]

function Tile({ icon: Icon, title, description, url, index, quotes, color, isPremium }: CreateTileGridProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentQuote, setCurrentQuote] = useState(0)
  const subscriptionStatus = useSubscriptionStore((state) => state.subscriptionStatus)

  const quoteInterval = useMemo(() => {
    if (isOpen) {
      return setInterval(() => {
        setCurrentQuote((prev) => (prev + 1) % quotes.length)
      }, 5000)
    }
    return null
  }, [isOpen, quotes.length])

  useEffect(() => {
    return () => {
      if (quoteInterval) clearInterval(quoteInterval)
    }
  }, [quoteInterval])

  const isDisabled =
    isPremium && (subscriptionStatus?.subscriptionPlan === "BASIC" || subscriptionStatus?.subscriptionPlan === "FREE")

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={isDisabled ? {} : { scale: 1.03, y: -5 }}
        whileTap={isDisabled ? {} : { scale: 0.98 }}
      >
        <Card
          className={`cursor-pointer h-full flex flex-col justify-between transition-all duration-300 hover:shadow-lg ${
            isDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => !isDisabled && setIsOpen(true)}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-xl sm:text-2xl">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className={`text-${color}-500`}
              >
                <Icon className="h-8 w-8 sm:h-12 sm:w-12 mr-2 sm:mr-3" />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {title}
              </motion.span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-base sm:text-lg text-muted-foreground text-center"
            >
              {description}
            </motion.p>
          </CardContent>
          <CardFooter className="justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Badge
                variant="secondary"
                className={`text-sm sm:text-base py-1 px-2 sm:py-2 sm:px-4 bg-${color}-100 dark:bg-${color}-800 text-${color}-700 dark:text-${color}-200`}
              >
                Explore AI Magic
              </Badge>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>

      <Dialog open={isOpen && !isDisabled} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[90vw] sm:h-[80vh] flex flex-col">
          <ScrollArea className="h-full">
            <DialogHeader>
              <DialogTitle className={`flex items-center text-2xl sm:text-4xl text-${color}-500`}>
                <motion.div
                  initial={{ rotate: 0, scale: 0 }}
                  animate={{ rotate: 360, scale: 1 }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
                  <Icon className="h-8 w-8 sm:h-12 sm:w-12 mr-2 sm:mr-3" />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {title}
                </motion.span>
              </DialogTitle>
              <DialogDescription asChild>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentQuote}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-lg sm:text-2xl italic mt-4 sm:mt-6"
                  >
                    "{quotes[currentQuote]}"
                  </motion.p>
                </AnimatePresence>
              </DialogDescription>
            </DialogHeader>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-grow flex flex-col justify-center items-center text-center py-6 sm:py-10"
            >
              <p className="text-base sm:text-xl mb-6 sm:mb-10">{description}</p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Icon className={`h-24 w-24 sm:h-40 sm:w-40 text-${color}-500`} />
              </motion.div>
            </motion.div>
          </ScrollArea>
          <DialogFooter>
            <Button
              asChild
              className={`w-full text-base sm:text-xl h-12 sm:h-14 bg-${color}-500 hover:bg-${color}-600 text-white`}
            >
              <Link href={url}>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Creating with AI
                </motion.span>
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function CreateTileGrid() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {tiles.map((tile, index) => (
          <Tile key={index} {...tile} index={index} isPremium={tile.isPremium} />
        ))}
      </div>
    </div>
  )
}

