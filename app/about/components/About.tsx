"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface StoryFrame {
  emoji: string
  text: string
}

const story: StoryFrame[] = [
  { emoji: "👩‍🏫", text: "Meet Sarah, a teacher with a passion for learning." },
  { emoji: "💡", text: "One day, she had a brilliant idea." },
  { emoji: "🖥️", text: "She discovered CourseAI and started creating online courses." },
  { emoji: "📚", text: "Sarah made courses on various topics she loved." },
  { emoji: "👨‍🎓👩‍🎓", text: "Students from all over the world joined her classes." },
  { emoji: "🌟", text: "Her courses became a huge success!" },
  { emoji: "🎉", text: "Now, Sarah inspires others to share their knowledge too." },
]

const emojiVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
  exit: {
    scale: 0,
    rotate: 180,
    transition: { duration: 0.2 },
  },
}

const textVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 10, delay: 0.2 },
  },
  exit: {
    opacity: 0,
    y: -50,
    transition: { duration: 0.2 },
  },
}

export const EmojiStory: React.FC = () => {
  const [currentFrame, setCurrentFrame] = useState(0)

  const nextFrame = () => {
    setCurrentFrame((prev) => (prev + 1) % story.length)
  }

  const prevFrame = () => {
    setCurrentFrame((prev) => (prev - 1 + story.length) % story.length)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="relative w-48 h-48">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFrame}
                variants={emojiVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 flex items-center justify-center text-8xl"
              >
                {story[currentFrame].emoji}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="h-20 text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentFrame}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-lg"
              >
                {story[currentFrame].text}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="flex justify-center space-x-4">
            <Button onClick={prevFrame} variant="outline">
              Previous
            </Button>
            <Button onClick={nextFrame}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

