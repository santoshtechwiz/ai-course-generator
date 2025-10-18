"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { ChevronDown, ArrowRight, Play } from "lucide-react"

import { FeedbackButton } from "@/components/ui/feedback-button"
import { useMobile } from "@/hooks"

// Apple-style easing
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

interface HeroSectionProps {
  scrollToFeatures: () => void
  scrollToHowItWorks: () => void
  isHydrated?: boolean
}

const HeroSection = ({ scrollToFeatures, scrollToHowItWorks, isHydrated = false }: HeroSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(true)

  // Simplified scroll effects
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // Optimized transforms
  const y = useTransform(scrollYProgress, [0, 1], [0, 50])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  // View detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.1 },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-16 bg-main text-main-foreground"
    >

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: isInView ? 1 : 0,
            y: isInView ? 0 : 20,
          }}
          transition={{ duration: 0.8, ease: APPLE_EASING }}
          className="mb-6"
        >
          <motion.span
            className="inline-block px-4 py-2 rounded-sm bg-background text-foreground text-sm font-bold mb-6 border-2 border-border shadow-[2px_2px_0px_0px_var(--border)]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isInView ? 1 : 0,
              scale: isInView ? 1 : 0.8,
            }}
            transition={{ duration: 0.6, delay: 0.2, ease: APPLE_EASING }}
          >
            AI-Powered Learning Platform
          </motion.span>
        </motion.div>

        {/* Main heading - Clear and honest */}
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight mb-4 sm:mb-6 max-w-4xl mx-auto leading-tight"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.7, delay: 0.3, ease: APPLE_EASING }}
          id="hero-heading"
        >
          Create Courses and Quizzes
          <br />
          with AI Assistance
        </motion.h1>

        <motion.p
          className="text-base sm:text-lg md:text-xl lg:text-2xl opacity-90 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.7, delay: 0.4, ease: APPLE_EASING }}
          id="hero-description"
        >
          Generate courses, create quizzes with multiple choice and open-ended questions,
          and track your learning progress—all powered by AI.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-6"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.7, delay: 0.5, ease: APPLE_EASING }}
        >
          <FeedbackButton
            size="lg"
            className="h-12 px-6 py-3 text-base sm:text-lg min-h-[48px] rounded-sm bg-background text-foreground border-3 border-border shadow-[4px_4px_0px_0px_var(--border)] hover:translate-x-[2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--border)] transition-none w-full sm:w-auto font-bold"
            loadingText="Opening..."
            successText="Let's go!"
            onClickAsync={async () => {
              await new Promise((resolve) => setTimeout(resolve, 300))
              scrollToFeatures()
              return true
            }}
            aria-label="Get started with CourseAI"
          >
            <span className="relative z-10">Get Started</span>
            <motion.span
              className="inline-block ml-2 relative z-10"
              aria-hidden="true"
            >
              <ArrowRight className="h-5 w-5" />
            </motion.span>
          </FeedbackButton>

          <FeedbackButton
            size="lg"
            variant="outline"
            className="h-12 px-6 py-3 text-base sm:text-lg min-h-[48px] rounded-sm border-2 border-border bg-transparent hover:bg-background/10 transition-none w-full sm:w-auto justify-center font-semibold"
            loadingText="Loading..."
            successText="Enjoy!"
            onClickAsync={async () => {
              await new Promise((resolve) => setTimeout(resolve, 300))
              scrollToHowItWorks()
              return true
            }}
            aria-label="See how CourseAI works"
          >
            <Play className="h-4 w-4 mr-2" />
            See How It Works
          </FeedbackButton>
        </motion.div>

        {/* Key features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 1.2, ease: APPLE_EASING }}
          className="mt-16"
        >
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2" role="text">
              <div className="w-2 h-2 rounded-sm bg-success" aria-hidden="true"></div>
              <span>AI course builder</span>
            </div>
            <div className="flex items-center gap-2" role="text">
              <div className="w-2 h-2 rounded-sm bg-primary" aria-hidden="true"></div>
              <span>Multiple quiz types</span>
            </div>
            <div className="flex items-center gap-2" role="text">
              <div className="w-2 h-2 rounded-sm bg-warning" aria-hidden="true"></div>
              <span>Progress tracking</span>
            </div>
          </div>
        </motion.div>
      </div>



      {/* Scroll indicator */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10, transition: { duration: 0.3 } }}
          transition={{ duration: 0.8, delay: 1.0, ease: APPLE_EASING }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer"
          onClick={scrollToFeatures}
          role="button"
          aria-label="Scroll to features section"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              scrollToFeatures()
            }
          }}
        >
          <motion.div className="flex flex-col items-center" whileHover={{ y: 3, transition: { duration: 0.2 } }}>
            <motion.span
              className="text-sm opacity-75 mb-2 font-medium"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              Explore features
            </motion.span>
            <motion.div
              className="w-10 h-10 rounded-sm flex items-center justify-center bg-background text-foreground hover:bg-background/90 transition-none border-2 border-border"
              animate={{
                y: [0, 6, 0],
                transition: {
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: APPLE_EASING,
                },
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default HeroSection
