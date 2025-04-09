"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"

interface ProgressiveTextProps {
  text: string
  className?: string
  delay?: number
  duration?: number
  staggerChildren?: number
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div"
  once?: boolean
}

const ProgressiveText = ({
  text,
  className = "",
  delay = 0,
  duration = 0.5,
  staggerChildren = 0.03,
  tag = "p",
  once = true,
}: ProgressiveTextProps) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, amount: 0.3 })
  const [words, setWords] = useState<string[]>([])

  useEffect(() => {
    // Split text into words
    setWords(text.split(" "))
  }, [text])

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren: delay * i,
      },
    }),
  }

  const child = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
        duration,
      },
    },
  }

  const Tag = tag

  const MotionTag = motion(Tag)

  return (
    <MotionTag
      ref={ref}
      style={{ overflow: "hidden" }}
      variants={container}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={child}
          style={{ display: "inline-block", marginRight: "0.25em", whiteSpace: "pre" }}
        >
          {word}
        </motion.span>
      ))}
      </MotionTag>
  )
}

export default ProgressiveText
