"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"
import { FileQuestion, BookOpen, PenTool, AlignLeft } from "lucide-react"
import Link from "next/link"

interface TileProps {
  icon: LucideIcon
  title: string
  description: string
  color: string
  url: string
  index: number
  quotes: string[]
}

const tiles = [
  {
    icon: FileQuestion,
    title: "Create MCQ",
    description: "Design multiple-choice questions with options, correct answers, and explanations.",
    color: "#FF9966",
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
    color: "#FF6B6B",
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
    color: "#4ECDC4",
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
    color: "#45B7D1",
    url: "/dashboard/blanks",
    quotes: [
      "Craft a fill-in-the-blanks activity to spark curiosity!",
      "Challenge learners with engaging word puzzles.",
      "Create exercises that make learning interactive and fun.",
    ],
  },
]

function Tile({ icon: Icon, title, description, color, url, index, quotes }: TileProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentQuote, setCurrentQuote] = useState(0)

  useEffect(() => {
    if (isExpanded) {
      const interval = setInterval(() => {
        setCurrentQuote((prev) => (prev + 1) % quotes.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isExpanded, quotes.length])

  return (
    <>
      <motion.div
        className="aspect-square cursor-pointer"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
        onClick={() => setIsExpanded(true)}
      >
        <div
          className="w-full h-full rounded-xl bg-card shadow-lg flex flex-col items-center justify-center p-4"
          style={{
            background: `linear-gradient(135deg, ${color}15, ${color}30)`,
            borderColor: `${color}40`,
            borderWidth: "1px",
          }}
        >
          <Icon size={40} color={color} className="mb-4" />
          <h2 className="text-card-foreground text-lg font-semibold text-center">{title}</h2>
          <motion.div
            className="absolute inset-0 rounded-xl"
            animate={{ boxShadow: [`0 0 0px ${color}00`, `0 0 20px ${color}50`, `0 0 0px ${color}00`] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-4xl bg-card rounded-xl shadow-lg p-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              style={{
                background: `linear-gradient(135deg, ${color}15, ${color}30)`,
                borderColor: `${color}40`,
                borderWidth: "2px",
              }}
            >
              <button className="absolute top-4 right-4 text-card-foreground" onClick={() => setIsExpanded(false)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <div className="flex items-center mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Icon size={60} color={color} />
                </motion.div>
                <h2 className="text-3xl font-bold ml-4 text-card-foreground">{title}</h2>
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={currentQuote}
                  className="text-xl font-medium mb-6 text-card-foreground"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  "{quotes[currentQuote]}"
                </motion.p>
              </AnimatePresence>

              <p className="text-lg mb-8 text-card-foreground">{description}</p>

              <Link href={url} className="w-full">
                <Button className="w-full text-white text-lg py-6" style={{ backgroundColor: color }}>
                  Start Creating
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function TileGrid() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full"
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={{
        visible: { transition: { staggerChildren: 0.1 } },
      }}
    >
      {tiles.map((tile, index) => (
        <Tile key={index} {...tile} index={index} />
      ))}
    </motion.div>
  )
}

