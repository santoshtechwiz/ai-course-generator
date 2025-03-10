"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useAnimation, useInView } from "framer-motion"
import { Video, FileQuestion, Bot, Sparkle } from "lucide-react"
import { useTheme } from "next-themes"

const icons = [Video, FileQuestion, Bot, Sparkle]

// Color palettes based on shadcn theme
const lightColors = ["text-blue-500", "text-green-500", "text-yellow-500", "text-red-500", "text-purple-500"]

const darkColors = ["text-blue-400", "text-green-400", "text-yellow-400", "text-red-400", "text-purple-400"]

type FlyingElement = {
  id: number
  x: number
  y: number
  icon: typeof Video | typeof FileQuestion | typeof Bot | typeof Sparkle
  size: number
  duration: number
  color: string
  delay: number
  rotate: number
}

export default function FlyingElements() {
  const [elements, setElements] = useState<FlyingElement[]>([])
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef)
  const controls = useAnimation()

  // Reduce the number of elements for better performance
  const ELEMENT_COUNT = 15

  useEffect(() => {
    if (isInView) {
      controls.start("animate")
    } else {
      controls.stop()
    }
  }, [isInView, controls])

  useEffect(() => {
    // Only create elements when the component is in view
    if (!isInView) return

    const newElements: FlyingElement[] = []
    const colors = theme === "dark" ? darkColors : lightColors

    for (let i = 0; i < ELEMENT_COUNT; i++) {
      newElements.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        icon: icons[Math.floor(Math.random() * icons.length)],
        size: Math.random() * 16 + 8, // Smaller size range between 8 and 24
        duration: Math.random() * 15 + 10, // Random duration between 10 and 25 seconds
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 5,
        rotate: Math.random() * 360,
      })
    }
    setElements(newElements)
  }, [theme, isInView])

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {elements.map((element) => (
        <motion.div
          key={element.id}
          initial={{
            x: `${element.x}%`,
            y: `${element.y}%`,
            opacity: 0,
            rotate: 0,
          }}
          animate={{
            x: [`${element.x}%`, `${(element.x + 10) % 100}%`, `${(element.x - 5) % 100}%`, `${element.x}%`],
            y: [`${element.y}%`, `${(element.y - 10) % 100}%`, `${(element.y + 5) % 100}%`, `${element.y}%`],
            opacity: [0, 0.4, 0.4, 0],
            rotate: [0, element.rotate, -element.rotate, 0],
            scale: [0.8, 1, 1.1, 0.9],
          }}
          transition={{
            duration: element.duration,
            delay: element.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            ease: "easeInOut",
          }}
          className="absolute will-change-transform"
        >
          <element.icon
            className={`${element.color} opacity-10`}
            style={{ width: element.size, height: element.size }}
          />
        </motion.div>
      ))}
    </div>
  )
}

