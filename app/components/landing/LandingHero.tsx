"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Element } from "react-scroll"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import FeatureVideo from "@/app/components/animations/FeatureVideo"
import RevealAnimation from "../shared/RevealAnimation"

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

interface LandingHeroProps {
  onTopicSubmit: (topic: string) => void
}

const LandingHero: React.FC<LandingHeroProps> = ({ onTopicSubmit }) => {
  const [topic, setTopic] = useState("")
  const router = useRouter()

  const handleTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (topic) {
      onTopicSubmit(topic)
    } else {
      router.push("/dashboard/create")
    }
  }

  return (
    <Element name="hero">
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-12">
            <div className="text-center space-y-8">
              <RevealAnimation>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                  Create AI-Powered Courses
                  <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                    {" "}
                    in Minutes
                  </span>
                </h1>
              </RevealAnimation>

              <RevealAnimation delay={0.2}>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Transform your knowledge into engaging courses with AI-generated content, interactive quizzes, and
                  personalized learning paths.
                </p>
              </RevealAnimation>

              <RevealAnimation delay={0.4}>
                <form onSubmit={handleTopicSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                  <Input
                    type="text"
                    placeholder="Enter a course topic..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="h-12 text-lg flex-grow"
                    aria-label="Course topic"
                  />
                  <Button type="submit" size="lg" className="h-12 px-8 w-full sm:w-auto">
                    Generate Course
                  </Button>
                </form>
              </RevealAnimation>
            </div>

            <RevealAnimation delay={0.6}>
              <div className="max-w-4xl mx-auto w-full">
                <main className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
                  <div className="w-full">
                    <FeatureVideo />
                  </div>
                </main>
              </div>
            </RevealAnimation>
          </motion.div>
        </div>
      </section>
    </Element>
  )
}

export default LandingHero

