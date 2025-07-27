"use client"

import type React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface QuizContainerProps {
  children: React.ReactNode
 
  animationKey?: string

  className?: string
}

// Animation variants for smooth transitions
const containerVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
}

export function QuizContainer({
  children,
  animationKey,
  className,
}: QuizContainerProps) {
  // Pure container: all progress, stats, and question logic is handled in QuizPlayLayout
  return (
    <motion.div
      key={animationKey}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        "w-full max-w-5xl mx-auto",
        "bg-background/50 backdrop-blur-sm",
        "rounded-2xl border border-border/50 shadow-lg",
        "p-4 sm:p-6 lg:p-8",
        "relative overflow-hidden",
        className
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full animate-pulse" />
      <div className="absolute bottom-4 left-4 w-1 h-1 bg-secondary/30 rounded-full animate-pulse delay-1000" />
    </motion.div>
  )
}