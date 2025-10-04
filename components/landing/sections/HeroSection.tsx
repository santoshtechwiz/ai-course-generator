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
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-16"
    >
      {/* Clean background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-gray-900 dark:via-gray-800/30 dark:to-gray-900 pointer-events-none"
        style={{ y }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

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
            className="inline-block px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6 border border-blue-200 dark:border-blue-800"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isInView ? 1 : 0,
              scale: isInView ? 1 : 0.8,
            }}
            transition={{ duration: 0.6, delay: 0.2, ease: APPLE_EASING }}
            whileHover={{
              scale: 1.03,
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              transition: { duration: 0.2 },
            }}
          >
            Think different. Learn different.
          </motion.span>
        </motion.div>

        {/* Main heading - More impactful like n8n */}
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 sm:mb-6 max-w-4xl mx-auto leading-tight"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.7, delay: 0.3, ease: APPLE_EASING }}
          id="hero-heading"
        >
          <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent">
            Transform any topic into
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
            extraordinary courses
          </span>
        </motion.h1>

        <motion.span
          className="inline-block text-lg sm:text-xl md:text-2xl font-semibold mb-6 sm:mb-8 text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.7, delay: 0.4, ease: APPLE_EASING }}
        >
          The fast way to create engaging courses
        </motion.span>

        <motion.p
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.7, delay: 0.5, ease: APPLE_EASING }}
          id="hero-description"
        >
          Combine AI-powered content creation with beautiful design.
          Create comprehensive learning experiences from any topic,
          complete with interactive quizzes and progress tracking.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-6"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.7, delay: 0.6, ease: APPLE_EASING }}
        >
          <FeedbackButton
            size="lg"
            className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:translate-y-[1px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 transition-all duration-200 w-full sm:w-auto"
            loadingText="Creating your experience..."
            successText="Welcome to CourseAI"
            onClickAsync={async () => {
              await new Promise((resolve) => setTimeout(resolve, 500))
              scrollToFeatures()
              return true
            }}
            aria-label="Get started with CourseAI"
          >
            <span className="relative z-10">Get started for free</span>
            <motion.span
              className="inline-block ml-2 relative z-10"
              initial={{ x: 0 }}
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              aria-hidden="true"
            >
              <ArrowRight className="h-5 w-5" />
            </motion.span>
          </FeedbackButton>

          <FeedbackButton
            size="lg"
            variant="outline"
            className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-full flex items-center hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:shadow-md hover:translate-y-[-2px] active:translate-y-[1px] transition-all duration-200 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 w-full sm:w-auto justify-center"
            loadingText="Preparing demo..."
            successText="Demo loaded"
            onClickAsync={async () => {
              await new Promise((resolve) => setTimeout(resolve, 500))
              scrollToHowItWorks()
              return true
            }}
            aria-label="See how CourseAI works"
          >
            <motion.div
              className="mr-3 rounded-full bg-blue-100 dark:bg-blue-900/50 p-1.5 flex items-center justify-center"
              whileHover={{ scale: 1.1, backgroundColor: "rgba(59, 130, 246, 0.2)" }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </motion.div>
            See how it works
          </FeedbackButton>
        </motion.div>

        {/* Trust indicators - More like n8n */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 1.2, ease: APPLE_EASING }}
          className="mt-16 space-y-8"
        >
          {/* Social proof stats */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2" role="text">
              <div className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true"></div>
              <span>10,000+ courses created</span>
            </div>
            <div className="flex items-center gap-2" role="text">
              <div className="w-2 h-2 rounded-full bg-blue-500" aria-hidden="true"></div>
              <span>50,000+ learners</span>
            </div>
            <div className="flex items-center gap-2" role="text">
              <div className="w-2 h-2 rounded-full bg-purple-500" aria-hidden="true"></div>
              <span>Free forever plan</span>
            </div>
          </div>

          {/* Company logos or trust indicators */}
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">Trusted by educators and organizations worldwide</p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 opacity-60">
              {/* Placeholder for company logos - you can add actual logos here */}
              <div className="text-gray-400 font-semibold">Universities</div>
              <div className="text-gray-400 font-semibold">Corporate Training</div>
              <div className="text-gray-400 font-semibold">E-learning Platforms</div>
              <div className="text-gray-400 font-semibold">Educational Startups</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Clean hero visualization */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.8, delay: 0.8, ease: APPLE_EASING }}
        style={{ y, opacity }}
        className="w-full max-w-4xl mx-auto mt-8 sm:mt-12 lg:mt-16 px-3 sm:px-4 relative z-0"
      >
        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {/* Clean mockup */}
          <div className="aspect-video bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 relative overflow-hidden p-8">
            {/* Header bar */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">CourseAI Dashboard</div>
            </div>

            {/* Content area */}
            <div className="space-y-6">
              {/* Course title */}
              <div className="h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-3/4"></div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Progress</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "75%" }}
                    transition={{ duration: 2, delay: 1, ease: APPLE_EASING }}
                  />
                </div>
              </div>

              {/* Content blocks */}
              <div className="grid grid-cols-3 gap-4">
                <motion.div
                  className="h-20 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1.2, ease: APPLE_EASING }}
                />
                <motion.div
                  className="h-20 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1.4, ease: APPLE_EASING }}
                />
                <motion.div
                  className="h-20 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800"
                  initial={{ opacity: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1.6, ease: APPLE_EASING }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10, transition: { duration: 0.3 } }}
          transition={{ duration: 0.8, delay: 1.5, ease: APPLE_EASING }}
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
              className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              Discover more
            </motion.span>
            <motion.div
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
              animate={{
                y: [0, 6, 0],
                transition: {
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: APPLE_EASING,
                },
              }}
            >
              <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default HeroSection
