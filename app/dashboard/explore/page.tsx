"use client"

import { motion } from "framer-motion"
import { TileGrid } from "../components/TileGrid"
import { HeroIllustration } from "../components/HeroIllustration"
import { TestimonialCarousel } from "../courses/components/TestimonialCarousel"


export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/10">
      <main className="flex-grow flex flex-col justify-center items-center px-4 py-12">
        <section className="w-full max-w-6xl mx-auto mb-16 flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <motion.h1
              className="text-5xl font-bold mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Welcome to Course AI
            </motion.h1>
            <motion.p
              className="text-xl text-muted-foreground mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Leverage AI-powered tools to create dynamic courses, quizzes, and educational content effortlessly.
            </motion.p>
            <motion.button
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Get Started
            </motion.button>
          </div>
          <motion.div
            className="md:w-1/2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <HeroIllustration />
          </motion.div>
        </section>

        <TileGrid />

        <section className="w-full max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">What Our Users Say</h2>
          <TestimonialCarousel />
        </section>
      </main>
    </div>
  )
}
