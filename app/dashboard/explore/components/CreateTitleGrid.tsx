"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { FileQuestion, BookOpen, PenTool, AlignLeft, Code } from "lucide-react"
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
    title: "Create MCQ",
    description: "Design multiple-choice questions with options, correct answers, and explanations.",
    url: "/dashboard/quiz",
    color: "blue",
    quotes: [
      "Challenge minds with thought-provoking MCQs!",
      "Craft questions that spark curiosity and learning.",
      "Design a quiz that engages and educates simultaneously.",
      "Test knowledge and critical thinking with well-crafted MCQs.",
      "Create a quiz that both challenges and enlightens.",
    ],
    isPremium: false,
  },
  {
    icon: PenTool,
    title: "Open Ended",
    description: "Create questions that allow students to provide detailed written responses.",
    url: "/dashboard/openended",
    color: "green",
    quotes: [
      "Inspire deep thinking with openended questions!",
      "Encourage students to express their ideas freely.",
      "Foster critical thinking through thoughtful inquiries.",
      "Unlock creativity with questions that have no limits.",
      "Explore the depths of knowledge with openended prompts.",
    ],
    isPremium: true,
  },
  {
    icon: AlignLeft,
    title: "Fill in the Blanks",
    description: "Create exercises where students complete sentences by filling in missing words.",
    url: "/dashboard/blanks",
    color: "pink",
    quotes: [
      "Craft a fill-in-the-blanks activity to spark curiosity!",
      "Challenge learners with engaging word puzzles.",
      "Create exercises that make learning interactive and fun.",
      "Bridge the gaps in knowledge with clever fill-in-the-blank questions.",
      "Enhance vocabulary and comprehension through interactive exercises.",
    ],
    isPremium: false,
  },
  {
    icon: BookOpen,
    title: "Course",
    description: "Build comprehensive courses with multiple lessons and content types.",
    url: "/dashboard/create",
    color: "purple",
    quotes: [
      "Why not create your own course?",
      "Share your expertise through an engaging course!",
      "Design a learning journey that inspires and educates.",
      "Transform your knowledge into a structured learning experience.",
      "Craft a course that leaves a lasting impact on learners.",
    ],
    isPremium: false,
  },
  {
    icon: Code,
    title: "Code Quiz",
    description: "Create coding challenges and quizzes to test programming skills.",
    url: "/dashboard/code",
    color: "red",
    quotes: [
      "Challenge coders with intriguing problems!",
      "Craft coding quizzes that sharpen programming skills.",
      "Design puzzles that push the boundaries of logical thinking.",
      "Create a coding challenge that both tests and teaches.",
      "Inspire the next generation of programmers with your quizzes.",
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

  const isDisabled = isPremium && (subscriptionStatus?.subscriptionPlan === "BASIC" || subscriptionStatus?.subscriptionPlan === "FREE")

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={isDisabled ? {} : { scale: 1.05 }}
        whileTap={isDisabled ? {} : { scale: 0.95 }}
      >
        <Card
          className={`cursor-pointer h-full flex flex-col justify-between transition-all duration-300 hover:bg-${color}-100 dark:hover:bg-${color}-900 group ${
            isDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => !isDisabled && setIsOpen(true)}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl group-hover:text-primary">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className={`text-${color}-500 group-hover:text-primary`}
              >
                <Icon className="h-12 w-12 mr-3" />
              </motion.div>
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground text-center group-hover:text-foreground">{description}</p>
          </CardContent>
          <CardFooter className="justify-center">
            <Badge
              variant="secondary"
              className={`text-lg py-2 px-4 bg-${color}-200 dark:bg-${color}-800 group-hover:bg-primary group-hover:text-primary-foreground`}
            >
              Click to explore
            </Badge>
          </CardFooter>
        </Card>
      </motion.div>

      <Dialog open={isOpen && !isDisabled} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[90vw] sm:h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className={`flex items-center text-4xl text-${color}-500`}>
              <motion.div initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                <Icon className="h-12 w-12 mr-3" />
              </motion.div>
              {title}
            </DialogTitle>
            <DialogDescription asChild>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentQuote}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl italic mt-6"
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
            className="flex-grow flex flex-col justify-center items-center text-center"
          >
            <p className="text-xl mb-10">{description}</p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Icon className={`h-40 w-40 text-${color}-500`} />
            </motion.div>
          </motion.div>
          <DialogFooter>
            <Button asChild className={`w-full text-xl h-14 bg-${color}-500 hover:bg-${color}-600 text-white`}>
              <Link href={url}>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Creating
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl w-full p-6">
      {tiles.map((tile, index) => (
        <Tile key={index} {...tile} index={index} isPremium={tile.isPremium} />
      ))}
    </div>
  )
}

