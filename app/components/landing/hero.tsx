"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { FileText } from 'lucide-react'
import { FloatingPaper } from "../animations/floating-paper"
import { RoboAnimation } from "../animations/robo-animation"
import RevealAnimation from "../shared/RevealAnimation"
import FeatureVideo from "../animations/FeatureVideo"

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center bg-background pt-20 md:pt-24">
      <div className="absolute inset-0 overflow-hidden">
        <FloatingPaper count={6} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
              Create AI-Powered Courses
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {" "} in Minutes
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground text-xl mb-8 max-w-2xl mx-auto"
          >
            Transform your knowledge into engaging courses with AI-generated content, interactive quizzes, and
            personalized learning paths.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="w-full sm:w-auto">
              <FileText className="mr-2 h-5 w-5" />
              Generate Course
            </Button>
          </motion.div>
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <RevealAnimation delay={0.6}>
            <div className="max-w-4xl mx-auto w-full">
              <main className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
                <div className="w-full">
                  <FeatureVideo />
                </div>
              </main>
            </div>
          </RevealAnimation>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 w-96 h-96">
        <RoboAnimation />
      </div>
    </div>
  )
}
