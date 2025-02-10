"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Video, FileQuestion, Bot, Sparkle } from 'lucide-react'
import { useTheme } from "next-themes"

const icons = [Video, FileQuestion, Bot, Sparkle]

// Color palettes based on shadcn theme
const lightColors = [
  "text-blue-500",
  "text-green-500",
  "text-yellow-500",
  "text-red-500",
  "text-purple-500",
]

const darkColors = [
  "text-blue-400",
  "text-green-400",
  "text-yellow-400",
  "text-red-400",
  "text-purple-400",
]

type FlyingElement = {
  id: number
  x: number
  y: number
  icon: typeof Video | typeof FileQuestion | typeof Bot | typeof Sparkle
  size: number
  duration: number
  color: string
}

export default function FlyingElements() {
  const [elements, setElements] = useState<FlyingElement[]>([])
  const { theme } = useTheme()

  useEffect(() => {
    const newElements: FlyingElement[] = []
    const colors = theme === "dark" ? darkColors : lightColors
    for (let i = 0; i < 30; i++) {
      newElements.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        icon: icons[Math.floor(Math.random() * icons.length)],
        size: Math.random() * 24 + 12, // Random size between 12 and 36
        duration: Math.random() * 20 + 10, // Random duration between 10 and 30 seconds
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }
    setElements(newElements)
  }, [theme])

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {elements.map((element) => (
        <motion.div
          key={element.id}
          initial={{ x: element.x, y: element.y, opacity: 0 }}
          animate={{
            x: [element.x, element.x + Math.random() * 200 - 100],
            y: [element.y, element.y + Math.random() * 200 - 100],
            opacity: [0, 0.7, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute"
        >
          <element.icon
            className={`${element.color} opacity-20`}
            style={{ width: element.size, height: element.size }}
          />
        </motion.div>
      ))}
    </div>
  )
}
