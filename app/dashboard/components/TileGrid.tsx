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
      }, 3000)
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
        </Card>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Icon className="h-6 w-6 mr-2" />
              {title}
            </DialogTitle>
            <DialogDescription asChild>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentQuote}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  "{quotes[currentQuote]}"
                </motion.p>
              </AnimatePresence>
            </DialogDescription>
          </DialogHeader>
          <p>{description}</p>
          <DialogFooter>
            <Button asChild className="w-full">
              <Link href={url}>Start Creating</Link>
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

