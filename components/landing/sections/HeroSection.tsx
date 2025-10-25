"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { ChevronDown, ArrowRight, Play } from "lucide-react"

import { FeedbackButton } from "@/components/ui/feedback-button"
import { HeroSkeleton } from "../skeletons"

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

  // Show skeleton loader while hydrating
  if (!isHydrated) {
    return <HeroSkeleton />
  }

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
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-16 px-4 sm:px-6 lg:px-8 bg-background text-foreground"
    >

  {/* Content - Full Width with max-width constraint */}
  <div className="w-full max-w-7xl mx-auto">
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
            className="inline-block px-4 sm:px-6 py-3 border-4 border-border text-foreground text-sm font-black mb-6 shadow-neo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isInView ? 1 : 0,
              scale: isInView ? 1 : 0.8,
            }}
            transition={{ duration: 0.6, delay: 0.2, ease: APPLE_EASING }}
          >
            AI-POWERED COURSE CREATION PLATFORM
          </motion.span>
        </motion.div>

        {/* Main heading - Clear and honest */}
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight mb-6 sm:mb-8 max-w-5xl mx-auto leading-tight text-center px-2"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.7, delay: 0.3, ease: APPLE_EASING }}
          id="hero-heading"
        >
          CREATE VIDEO COURSES AND
          <br />
          <span className="text-foreground">GENERATE QUIZZES</span>
        </motion.h1>

        <motion.p
          className="text-base sm:text-lg md:text-xl lg:text-2xl max-w-4xl mx-auto mb-8 sm:mb-12 leading-relaxed text-center font-medium px-4"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.7, delay: 0.4, ease: APPLE_EASING }}
          id="hero-description"
        >
          Build structured courses with YouTube videos and automatically generate multiple-choice, coding, fill-in-the-blank, and open-ended quizzes.
          Track progress and get AI-driven recommendations for personalized learning.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-4"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.7, delay: 0.5, ease: APPLE_EASING }}
        >
          <FeedbackButton
            className="h-12 sm:h-14 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-black border-4 border-border shadow-neo hover:translate-x-[3px] hover:translate-y-[-3px] hover:shadow-[9px_9px_0px_0px_var(--color-border)] transition-none w-full sm:w-auto bg-foreground text-background max-w-xs"
            loadingText="Opening..."
            successText="Let's go!"
            onClickAsync={async () => {
              await new Promise((resolve) => setTimeout(resolve, 300))
              scrollToFeatures()
              return true
            }}
            aria-label="Get started with CourseAI"
          >
            GET STARTED
          </FeedbackButton>

          <FeedbackButton
            className="h-12 sm:h-14 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-black border-4 border-border bg-transparent text-foreground hover:bg-foreground hover:text-background transition-none w-full sm:w-auto justify-center max-w-xs"
            loadingText="Loading..."
            successText="Enjoy!"
            onClickAsync={async () => {
              await new Promise((resolve) => setTimeout(resolve, 300))
              scrollToHowItWorks()
              return true
            }}
            aria-label="See how CourseAI works"
          >
            SEE HOW IT WORKS
          </FeedbackButton>
        </motion.div>

        {/* Key features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 1.2, ease: APPLE_EASING }}
          className="mt-12 sm:mt-16 px-4"
        >
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2" role="text">
              <div className="w-2 h-2 rounded-sm bg-success" aria-hidden="true"></div>
              <span>Video course builder</span>
            </div>
            <div className="flex items-center gap-2" role="text">
              <div className="w-2 h-2 rounded-sm bg-accent" aria-hidden="true"></div>
              <span>AI quiz generation</span>
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
              className="text-sm mb-2 font-medium"
              animate={{ opacity: [0.8, 1, 0.8] }}
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
