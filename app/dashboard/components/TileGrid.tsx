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
}

const tiles = [
  {
    icon: FileQuestion,
    title: "Create MCQ",
    description: "Design multiple-choice questions with options, correct answers, and explanations.",
    color: "#FF9966",
    url: "/dashboard/quiz",
  },
  {
    icon: PenTool,
    title: "Open Ended",
    description: "Create questions that allow students to provide detailed written responses.",
    color: "#FF6B6B",
    url: "/dashboard/openended",
  },
  {
    icon: BookOpen,
    title: "Course",
    description: "Build comprehensive courses with multiple lessons and content types.",
    color: "#4ECDC4",
    url: "/dashboard/create",
  },
  {
    icon: AlignLeft,
    title: "Fill in the Blanks",
    description: "Create exercises where students complete sentences by filling in missing words.",
    color: "#45B7D1",
    url: "/dashboard/blanks",
  },
]

function Tile({ icon: Icon, title, description, color, url, index }: TileProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <motion.div
      className="aspect-square cursor-pointer perspective"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsFlipped(true)}
      onHoverEnd={() => setIsFlipped(false)}
    >
      <AnimatePresence initial={false} mode="wait">
        {!isFlipped ? (
          <motion.div
            key="front"
            className="absolute w-full h-full rounded-xl bg-card shadow-lg flex flex-col items-center justify-center p-4"
            initial={{ rotateY: 180 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: 180 }}
            transition={{ duration: 0.4 }}
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
          </motion.div>
        ) : (
          <motion.div
            key="back"
            className="absolute w-full h-full rounded-xl shadow-lg bg-card flex flex-col items-start justify-between p-4"
            initial={{ rotateY: -180 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: -180 }}
            transition={{ duration: 0.4 }}
            style={{
              background: `linear-gradient(135deg, ${color}15, ${color}30)`,
              borderColor: `${color}40`,
              borderWidth: "1px",
            }}
          >
            <p className="text-card-foreground text-sm leading-relaxed mb-4">{description}</p>
            <Link href={url} className="w-full">
              <Button className="w-full text-white" style={{ backgroundColor: color }}>
                Create
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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

