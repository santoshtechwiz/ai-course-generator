"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { ChevronDown, ArrowRight, Play } from "lucide-react"

import { FeedbackButton } from "@/components/ui/feedback-button"
import { useMobile } from "@/hooks"

// Optimized Apple-style easing
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
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
    >
      {/* Simplified background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20 pointer-events-none"
        style={{ y }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 md:px-6 z-10 text-center">
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
            className="inline-block px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isInView ? 1 : 0,
              scale: isInView ? 1 : 0.8,
            }}
            transition={{ duration: 0.6, delay: 0.2, ease: APPLE_EASING }}
            whileHover={{
              scale: 1.03,
              backgroundColor: "rgba(var(--primary-rgb), 0.15)",
              transition: { duration: 0.2 },
            }}
          >
            Think different. Learn different.
          </motion.span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.7, delay: 0.3, ease: APPLE_EASING }}
          id="hero-heading"
        >
          <span className="inline-block">Create</span>{" "}
          <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            extraordinary
          </span>{" "}
          <span className="inline-block">courses with AI</span>
        </motion.h1>

        <motion.span
          className="inline-block text-xl md:text-2xl font-semibold mb-8 text-muted-foreground"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.7, delay: 0.4, ease: APPLE_EASING }}
        >
          From any topic, in minutes
        </motion.span>

        <motion.p
          className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.7, delay: 0.5, ease: APPLE_EASING }}
          id="hero-description"
        >
          Transform your knowledge into engaging, interactive courses.
          CourseAI creates comprehensive learning experiences from any topic,
          complete with quizzes, progress tracking, and beautiful design.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.7, delay: 0.6, ease: APPLE_EASING }}
        >
          <FeedbackButton
            size="lg"
            className="px-10 py-6 text-lg rounded-full bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:translate-y-[1px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
            loadingText="Creating your experience..."
            successText="Welcome to CourseAI"
            onClickAsync={async () => {
              await new Promise((resolve) => setTimeout(resolve, 500))
              scrollToFeatures()
              return true
            }}
            aria-label="Explore CourseAI features"
          >
            <span className="relative z-10">Start Creating</span>
            <motion.span
              className="inline-block ml-2 relative z-10"
              initial={{ x: 0 }}
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              aria-hidden="true"
            >
              <ArrowRight className="h-5 w-5" />
            </motion.span>
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, repeatType: "mirror" }}
              aria-hidden="true"
            />
          </FeedbackButton>

          <FeedbackButton
            size="lg"
            variant="outline"
            className="px-10 py-6 text-lg rounded-full flex items-center hover:bg-primary/5 hover:shadow-md hover:translate-y-[-2px] active:translate-y-[1px] transition-all duration-300 border-primary/20 font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
            loadingText="Preparing demo..."
            successText="Demo loaded"
            onClickAsync={async () => {
              await new Promise((resolve) => setTimeout(resolve, 500))
              scrollToHowItWorks()
              return true
            }}
            aria-label="Watch CourseAI demo video"
          >
            <motion.div
              className="mr-3 rounded-full bg-primary/10 p-1.5 flex items-center justify-center"
              whileHover={{ scale: 1.1, backgroundColor: "rgba(var(--primary-rgb), 0.2)" }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Play className="h-4 w-4 text-primary" />
            </motion.div>
            Watch Demo
          </FeedbackButton>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 1.2, ease: APPLE_EASING }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
          role="region"
          aria-label="Trust indicators"
        >
          <div className="flex items-center gap-2" role="text">
            <div className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true"></div>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2" role="text">
            <div className="w-2 h-2 rounded-full bg-blue-500" aria-hidden="true"></div>
            <span>Free 14-day trial</span>
          </div>
          <div className="flex items-center gap-2" role="text">
            <div className="w-2 h-2 rounded-full bg-purple-500" aria-hidden="true"></div>
            <span>Cancel anytime</span>
          </div>
        </motion.div>
      </div>

      {/* Simplified hero image */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.8, delay: 0.8, ease: APPLE_EASING }}
        style={{ y, opacity }}
        className="w-full max-w-5xl mx-auto mt-16 px-4 relative z-0"
      >
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          <div className="aspect-video bg-gradient-to-br from-background/80 to-muted/30 backdrop-blur-sm relative overflow-hidden">
            {/* Simplified content visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-4/5 h-4/5 rounded-xl bg-background/40 backdrop-blur-md border border-primary/10 p-6 flex flex-col"
                animate={{
                  y: [0, -8, 0],
                  boxShadow: [
                    "0 0 0 0 rgba(var(--primary-rgb), 0)",
                    "0 25px 50px -10px rgba(var(--primary-rgb), 0.2)",
                    "0 0 0 0 rgba(var(--primary-rgb), 0)",
                  ],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              >
                {/* Simplified content blocks */}
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>

                <div className="flex-1 flex flex-col space-y-3">
                  <motion.div
                    className="h-6 w-3/4 bg-primary/10 rounded-md"
                    animate={{ width: ["60%", "75%", "60%"] }}
                    transition={{
                      duration: 8,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                  />

                  <div className="flex space-x-3">
                    <motion.div
                      className="h-24 w-1/3 bg-primary/5 rounded-md"
                      animate={{ height: ["6rem", "7rem", "6rem"] }}
                      transition={{
                        duration: 10,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      }}
                    />
                    <motion.div
                      className="h-24 w-1/3 bg-primary/10 rounded-md"
                      animate={{ height: ["7rem", "5.5rem", "7rem"] }}
                      transition={{
                        duration: 9,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: 0.5,
                      }}
                    />
                    <motion.div
                      className="h-24 w-1/3 bg-primary/5 rounded-md"
                      animate={{ height: ["5rem", "8rem", "5rem"] }}
                      transition={{
                        duration: 11,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: 1,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Simplified reflection effect */}
            <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-white/20 to-transparent transform scale-y-[-1] blur-sm opacity-30"></div>
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
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 cursor-pointer"
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
              className="text-sm text-muted-foreground mb-2 font-medium"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              Discover more
            </motion.span>
            <motion.div
              className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors"
              animate={{
                y: [0, 8, 0],
                boxShadow: [
                  "0 0 0 0 rgba(var(--primary-rgb), 0)",
                  "0 0 0 6px rgba(var(--primary-rgb), 0.1)",
                  "0 0 0 0 rgba(var(--primary-rgb), 0)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: APPLE_EASING,
              }}
            >
              <ChevronDown className="h-5 w-5 text-primary" />
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default HeroSection
