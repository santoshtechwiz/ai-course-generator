"use client"

import { motion } from "framer-motion"
import { TileGrid } from "../components/TileGrid"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/10">
      <main className="flex-grow flex flex-col justify-center items-center px-4 py-12">
        <motion.h1
          className="text-4xl font-bold text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Welcome to Course AI
        </motion.h1>
        <motion.p
          className="text-xl text-center text-muted-foreground mb-12 max-w-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Leverage AI-powered tools to create dynamic courses, quizzes, and educational content effortlessly.
        </motion.p>
        <TileGrid />
      </main>
    </div>
  )
}

