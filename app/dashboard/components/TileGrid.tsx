"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { FileQuestion, BookOpen, PenTool, AlignLeft, X } from "lucide-react"
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

interface TileProps {
  icon: LucideIcon
  title: string
  description: string
  url: string
  index: number
  quotes: string[]
}

const tiles = [
  {
    icon: FileQuestion,
    title: "Create MCQ",
    description: "Design multiple-choice questions with options, correct answers, and explanations.",
    url: "/dashboard/quiz",
    quotes: [
      "Challenge minds with thought-provoking MCQs!",
      "Craft questions that spark curiosity and learning.",
      "Design a quiz that engages and educates simultaneously.",
      "Test knowledge and critical thinking with well-crafted MCQs.",
      "Create a quiz that both challenges and enlightens.",
    ],
  },
  {
    icon: PenTool,
    title: "Open Ended",
    description: "Create questions that allow students to provide detailed written responses.",
    url: "/dashboard/openended",
    quotes: [
      "Inspire deep thinking with open-ended questions!",
      "Encourage students to express their ideas freely.",
      "Foster critical thinking through thoughtful inquiries.",
      "Unlock creativity with questions that have no limits.",
      "Explore the depths of knowledge with open-ended prompts.",
    ],
  },
  {
    icon: BookOpen,
    title: "Course",
    description: "Build comprehensive courses with multiple lessons and content types.",
    url: "/dashboard/create",
    quotes: [
      "Why not create your own course?",
      "Share your expertise through an engaging course!",
      "Design a learning journey that inspires and educates.",
      "Transform your knowledge into a structured learning experience.",
      "Craft a course that leaves a lasting impact on learners.",
    ],
  },
  {
    icon: AlignLeft,
    title: "Fill in the Blanks",
    description: "Create exercises where students complete sentences by filling in missing words.",
    url: "/dashboard/blanks",
    quotes: [
      "Craft a fill-in-the-blanks activity to spark curiosity!",
      "Challenge learners with engaging word puzzles.",
      "Create exercises that make learning interactive and fun.",
      "Bridge the gaps in knowledge with clever fill-in-the-blank questions.",
      "Enhance vocabulary and comprehension through interactive exercises.",
    ],
  },
]

function Tile({ icon: Icon, title, description, url, index, quotes }: TileProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentQuote, setCurrentQuote] = useState(0)

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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Card className="cursor-pointer h-full" onClick={() => setIsOpen(true)}>
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Icon className="h-8 w-8 mr-2" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">{description}</p>
          </CardContent>
          <CardFooter className="justify-center">
            <Badge variant="secondary">Click to explore</Badge>
          </CardFooter>
        </Card>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[90vw] sm:h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center text-3xl">
              <Icon className="h-8 w-8 mr-2" />
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
                  className="text-xl italic mt-4"
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
            <p className="text-lg mb-8">{description}</p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Icon className="h-32 w-32 text-primary" />
            </motion.div>
          </motion.div>
          <DialogFooter>
            <Button asChild className="w-full text-lg h-12">
              <Link href={url}>
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
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

export function TileGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
      {tiles.map((tile, index) => (
        <Tile key={index} {...tile} index={index} />
      ))}
    </div>
  )
}

