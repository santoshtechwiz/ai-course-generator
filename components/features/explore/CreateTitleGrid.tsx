"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { FileQuestion, BookOpen, PenTool, AlignLeft, Code, FileText, Puzzle, Brain } from "lucide-react"
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
import { useSubscriptionStore } from "@/app/store/subscriptionStore"

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
    title: "AI-Enhanced MCQs",
    description: "Transform your quizzes with AI-generated multiple-choice questions that adapt to each learner's performance.",
    url: "/dashboard/mcq",
    color: "blue",
    quotes: [
      "Harness AI for adaptive MCQs that challenge and engage!",
      "Elevate your assessments with smart, dynamic question generation.",
      "Let AI craft balanced questions tailored to your students.",
      "Experience quizzes that evolve with every answer.",
      "Boost learning outcomes with AI-powered MCQs.",
    ],
    isPremium: false,
  },
  {
    icon: FileText,
    title: "Document Quiz Generator",
    description: "Upload documents and let our AI convert key insights into engaging, comprehensive quizzes.",
    url: "/dashboard/document",
    color: "amber",
    quotes: [
      "Turn any document into an interactive quiz in seconds!",
      "Extract the essence of texts and test comprehension effortlessly.",
      "Transform articles and research into dynamic assessments.",
      "Streamline quiz creation with smart document parsing.",
      "Experience effortless quiz generation from your study materials.",
    ],
    isPremium: false,
  },
  {
    icon: PenTool,
    title: "Essay Question Creator",
    description: "Spark critical thinking with AI-generated open-ended questions designed to inspire in-depth analysis.",
    url: "/dashboard/openended",
    color: "green",
    quotes: [
      "Ignite creativity with thought-provoking essay prompts!",
      "Let AI design questions that encourage unique insights.",
      "Challenge students with innovative, open-ended queries.",
      "Stimulate deeper understanding with AI-crafted essay topics.",
      "Foster critical thinking with creative, adaptive prompts.",
    ],
    isPremium: true,
  },
  {
    icon: AlignLeft,
    title: "Smart Fill-in-the-Blanks",
    description: "Generate intelligent fill-in-the-blank exercises that boost vocabulary and reinforce key concepts.",
    url: "/dashboard/blanks",
    color: "pink",
    quotes: [
      "Craft engaging fill-in-the-blank challenges with AI!",
      "Enhance learning with context-aware gap fillers.",
      "Create exercises that adapt to learner proficiency.",
      "Use AI to spotlight and reinforce key concepts.",
      "Transform simple exercises into interactive learning tools.",
    ],
    isPremium: false,
  },
  {
    icon: BookOpen,
    title: "Dynamic Course Builder",
    description: "Leverage AI to structure comprehensive courses with personalized content and adaptive learning paths.",
    url: "/dashboard/create",
    color: "purple",
    quotes: [
      "Build smart courses that evolve with every learner!",
      "Design engaging curriculums powered by intelligent algorithms.",
      "Transform course creation with dynamic, adaptive content.",
      "Craft personalized learning journeys with AI guidance.",
      "Experience the future of course creation with smart automation.",
    ],
    isPremium: false,
  },
  {
    icon: Code,
    title: "Coding Challenge Creator",
    description: "Generate a variety of coding challenges and quizzes with AI to test and enhance programming skills.",
    url: "/dashboard/code",
    color: "red",
    quotes: [
      "Develop coding challenges that scale with your learners!",
      "Test programming skills with intelligently generated tasks.",
      "Create interactive coding tests with AI precision.",
      "Push logical boundaries with adaptive coding challenges.",
      "Empower your students with smart, language-specific quizzes.",
    ],
    isPremium: true,
  },
  {
    icon: Brain,
    title: "Adaptive Flashcards",
    description: "Revolutionize study sessions with AI-powered flashcards that adjust to your learning pace.",
    url: "/dashboard/flashcard",
    color: "red",
    quotes: [
      "Boost memory retention with adaptive flashcards!",
      "Experience personalized revision with AI-powered decks.",
      "Engage with flashcards that evolve as you learn.",
      "Master subjects faster with smart spaced repetition.",
      "Transform study routines with intelligent flashcard systems.",
    ],
    isPremium: false,
  },
]

function Tile({ icon: Icon, title, description, url, index, quotes, color, isPremium }: CreateTileGridProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentQuote, setCurrentQuote] = useState(0)
  const {data} = useSubscriptionStore();

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
    isPremium && (data?.subscriptionPlan === "BASIC" || data?.subscriptionPlan === "FREE")

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={isDisabled ? {} : { scale: 1.03, y: -5 }}
        whileTap={isDisabled ? {} : { scale: 0.98 }}
        aria-label={`Open details for ${title}`}
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
                Discover AI Magic
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
              aria-label={`Get started with ${title}`}
            >
              <Link href={url}>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
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
