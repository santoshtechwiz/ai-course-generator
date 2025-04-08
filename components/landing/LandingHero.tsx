"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Element } from "react-scroll"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import RevealAnimation from "../shared/RevealAnimation"
import FeatureVideo from "./FeatureVideo"

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

interface LandingHeroProps {
  onTopicSubmit: (title: string) => void
}

const LandingHero: React.FC<LandingHeroProps> = ({ onTopicSubmit }) => {
  const [topic, setTopic] = useState("")
  const router = useRouter()

  return (
    <Element name="hero">
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-10 md:space-y-12">
            <div className="text-center space-y-6">
              <RevealAnimation>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  Create AI-Powered Courses
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {" "}
                    in Minutes
                  </span>
                </h1>
              </RevealAnimation>

              <RevealAnimation delay={0.2}>
                <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
                  Transform your knowledge into engaging courses with AI-generated content, interactive quizzes, and
                  personalized learning paths.
                </p>
              </RevealAnimation>

              <RevealAnimation delay={0.4}>
                <Button
                  onClick={() => onTopicSubmit(topic)}
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto px-8 py-3 text-base font-medium rounded-full"
                >
                  Generate Course
                </Button>
              </RevealAnimation>
            </div>

            <RevealAnimation delay={0.6}>
              <div className="mx-auto max-w-5xl w-full">
                <FeatureVideo />
              </div>
            </RevealAnimation>
          </motion.div>
        </div>
      </section>
    </Element>
  )
}

export default LandingHero
