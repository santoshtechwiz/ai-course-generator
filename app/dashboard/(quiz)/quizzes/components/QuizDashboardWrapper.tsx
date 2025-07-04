"use client"

import React from "react"
import { motion } from "framer-motion"

interface QuizDashboardWrapperProps {
  children: React.ReactNode
}

const QuizDashboardWrapper = ({ children }: QuizDashboardWrapperProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        type: "spring",
        stiffness: 70,
        damping: 20,
        mass: 1
      }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}

export default QuizDashboardWrapper;
