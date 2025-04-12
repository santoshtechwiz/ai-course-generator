"use client"

import { useRef, useState } from "react"
import { motion, useScroll, useTransform, AnimatePresence, useSpring, useInView } from "framer-motion"
import { ChevronDown, ArrowRight, Play } from "lucide-react"

import { useMobile } from "@/hooks/use-mobile"
import { FeedbackButton } from "@/components/ui/feedback-button"

interface HeroSectionProps {
  scrollToFeatures: () => void
  scrollToHowItWorks: () => void
}

// Enhanced easing for refined animations
const APPLE_EASING = [0.22, 0.61, 0.36, 1]

// Revamped AppleStyleParticles component with a more vibrant color scheme and subtle hue variations
const AppleStyleParticles = () => {
  const isMobile = useMobile()
  const particleCount = isMobile ? 8 : 15

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: particleCount }).map((_, i) => {
        const size = Math.random() * 40 + 10
        const depth = Math.random() * 0.5 + 0.3
        // Use a set of engaging hues – here using a mix of vibrant blue/purple tones with a warm accent
        const hues = ["220,90%,60%", "270,70%,60%", "30,90%,65%"]
        const hue = hues[i % hues.length]

        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full"
            initial={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              scale: depth,
              opacity: Math.random() * 0.3 + 0.2,
              filter: `blur(${(1 - depth) * 5}px)`,
            }}
            animate={{
              y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
              x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
              rotate: [0, Math.random() * 180],
              scale: [depth, depth * (1 + Math.random() * 0.2), depth],
            }}
            transition={{
              duration: Math.random() * 30 + 30,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "mirror",
              ease: "linear",
            }}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              zIndex: Math.floor(depth * 10),
              willChange: "transform, opacity",
              background: `radial-gradient(circle, hsla(${hue}, ${0.15 + depth * 0.15}) 0%, hsla(${hue}, 0) 70%)`,
              boxShadow: `0 0 ${size / 4}px hsla(${hue}, ${0.05 + depth * 0.05})`,
            }}
          />
        )
      })}
    </div>
  )
}

// Optimized title animation with refined easing and a slight color accent for emphasis
const titleAnimation = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.1 * i,
      duration: 0.8,
      ease: APPLE_EASING,
    },
  }),
}

// A reusable component for reveal animations on scroll
const RevealAnimation = ({ children, delay = 0, direction = "up", distance = 20, duration = 0.8, className = "" }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: true,
    amount: 0.2,
    margin: "-10% 0px -10% 0px",
  })

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? distance : direction === "down" ? -distance : 0,
      x: direction === "left" ? distance : direction === "right" ? -distance : 0,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      filter: "blur(0px)",
      transition: {
        duration,
        delay,
        ease: APPLE_EASING,
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  )
}

// Enhanced ScrollIndicator with interactive animation inviting users to scroll
const ScrollIndicator = ({ scrollToFeatures, hasScrolled }) => {
  return (
    <AnimatePresence>
      {!hasScrolled && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10, transition: { duration: 0.4 } }}
          transition={{ duration: 0.9, delay: 1.8, ease: APPLE_EASING }}
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
          <motion.div
            className="flex flex-col items-center"
            whileHover={{ y: 5, scale: 1.05, transition: { duration: 0.3 } }}
          >
            <motion.span
              className="text-sm text-white mb-2 font-medium drop-shadow-md"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY }}
            >
              Explore More
            </motion.span>
            <motion.div
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/30 hover:bg-white/40 backdrop-blur-sm transition-colors shadow-lg"
              animate={{
                y: [0, 12, 0],
                boxShadow: [
                  "0 0 0 0 rgba(255,255,255,0)",
                  "0 0 0 8px rgba(255,255,255,0.15)",
                  "0 0 0 0 rgba(255,255,255,0)",
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: APPLE_EASING,
              }}
            >
              <ChevronDown className="h-5 w-5 text-white drop-shadow-md" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Fix Hero section alignment and optimize animations
const HeroSection = ({ scrollToFeatures, scrollToHowItWorks }: HeroSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()
  const [hasScrolled, setHasScrolled] = useState(false)
  const [isInView, setIsInView] = useState(true)
  const isContentInView = useInView(titleRef, { once: true, amount: 0.2 })

  // Optimize parallax effects with smoother motion and reduced calculations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // Use spring with optimized parameters for better performance
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50, // Reduced from 60
    damping: 15, // Reduced from 20
    restDelta: 0.001,
    mass: 0.8, // Reduced from 1
  })

  // Optimize transform calculations
  const y = useTransform(smoothProgress, [0, 1], [0, 150]) // Reduced from 180
  const scale = useTransform(smoothProgress, [0, 1], [1, 1.1]) // Reduced from 1.12
  const opacity = useTransform(smoothProgress, [0, 0.7], [1, 0]) // Changed from [0, 0.8]
  const rotate = useTransform(smoothProgress, [0, 1], [0, -3]) // Reduced from -5

  // Optimize text parallax for better performance
  const titleY = useTransform(smoothProgress, [0, 1], [0, 40]) // Reduced from 50
  const subtitleY = useTransform(smoothProgress, [0, 1], [0, 60]) // Reduced from 80
  const buttonsY = useTransform(smoothProgress, [0, 1], [0, 80]) // Reduced from 120
  const bgY = useTransform(smoothProgress, [0, 1], [0, 30]) // Reduced from 40
  const bgScale = useTransform(smoothProgress, [0, 1], [1, 1.05]) // Reduced from 1.08

  const handleExploreFeatures = async () => {
    await new Promise((resolve) => setTimeout(resolve, 600))
    scrollToFeatures()
    return true
  }

  // Fix alignment issues in the hero section
  return (
    <div
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
      style={{
        willChange: "transform, opacity",
        perspective: "1200px", // Reduced from 1500px for better performance
      }}
    >
      {/* Dynamic background gradient with optimized animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-blue-700 via-purple-700 to-pink-600 pointer-events-none"
        style={{ y: bgY, scale: bgScale }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }} // Reduced from 2s
      />

      {/* Optimize AppleStyleParticles component by reducing particle count */}
      <AppleStyleParticles />

      {/* Content with optimized animations */}
      <div className="container max-w-6xl mx-auto px-4 md:px-6 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }} // Reduced from 20
          animate={{
            opacity: isContentInView ? 1 : 0,
            y: isContentInView ? 0 : 15, // Reduced from 20
          }}
          transition={{ duration: 1, ease: APPLE_EASING }} // Reduced from 1.2
          className="mb-6"
          style={{ y: titleY }}
        >
          <motion.span
            className="inline-block px-5 py-2 rounded-full bg-yellow-200 text-yellow-800 text-sm font-medium mb-6 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.9 }} // Increased from 0.8 for smoother animation
            animate={{
              opacity: isContentInView ? 1 : 0,
              scale: isContentInView ? 1 : 0.9, // Increased from 0.8
            }}
            transition={{ duration: 0.7, delay: 0.2, ease: APPLE_EASING }} // Reduced from 0.8
            whileHover={{
              scale: 1.03, // Reduced from 1.05
              backgroundColor: "rgba(234, 179, 8, 0.3)",
              transition: { duration: 0.2 },
            }}
          >
            Introducing CourseAI
          </motion.span>
        </motion.div>

        {/* Fix alignment of heading */}
        <div className="overflow-hidden">
          <motion.h1
            ref={titleRef}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto"
            style={{ y: titleY }}
          >
            <motion.span
              className="inline-block"
              custom={1}
              initial="hidden"
              animate={isContentInView ? "visible" : "hidden"}
              variants={titleAnimation}
            >
              Create Engaging{" "}
            </motion.span>
            <motion.span
              className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500"
              custom={2}
              initial="hidden"
              animate={isContentInView ? "visible" : "hidden"}
              variants={titleAnimation}
            >
              AI-powered
            </motion.span>
            <br />
            <motion.span
              className="inline-block"
              custom={3}
              initial="hidden"
              animate={isContentInView ? "visible" : "hidden"}
              variants={titleAnimation}
            >
              courses and quizzes
            </motion.span>
          </motion.h1>
        </div>

        {/* Fix alignment of subtitle */}
        <motion.span
          className="inline-block text-xl md:text-2xl font-semibold text-white"
          custom={4}
          initial="hidden"
          animate={isContentInView ? "visible" : "hidden"}
          variants={titleAnimation}
        >
          From Any Topic
        </motion.span>

        <motion.p
          initial={{ opacity: 0, y: 30, filter: "blur(3px)" }} // Reduced from 40, 4px
          animate={{
            opacity: isContentInView ? 1 : 0,
            y: isContentInView ? 0 : 30, // Reduced from 40
            filter: isContentInView ? "blur(0px)" : "blur(3px)", // Reduced from 4px
          }}
          transition={{ duration: 1, delay: 0.7, ease: APPLE_EASING }} // Reduced from 1.2, 0.8
          className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto mb-10"
          style={{ y: subtitleY }}
        >
          Turn text, ideas, or content into interactive, high-quality courses—no videos required. We transform your
          content into immersive learning experiences.
        </motion.p>

        {/* Fix CTA buttons alignment and optimize animations */}
        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(3px)" }} // Reduced from 50, 4px
          animate={{
            opacity: isContentInView ? 1 : 0,
            y: isContentInView ? 0 : 40, // Reduced from 50
            filter: isContentInView ? "blur(0px)" : "blur(3px)", // Reduced from 4px
          }}
          transition={{ duration: 1, delay: 0.9, ease: APPLE_EASING }} // Reduced from 1.2, 1.0
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ y: buttonsY }}
        >
          <FeedbackButton
            size="lg"
            className="px-8 py-6 text-lg rounded-full bg-green-500 hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-[1px]"
            loadingText="Loading features..."
            successText="Exploring features"
            onClickAsync={handleExploreFeatures}
          >
            <span className="relative z-10">Explore Features</span>
            <motion.span
              className="inline-block ml-2 relative z-10"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }} // Reduced from 500
            >
              <ArrowRight className="h-5 w-5" />
            </motion.span>
            <motion.span
              className="absolute inset-0 rounded-full bg-green-400/20 blur-xl"
              initial={{ opacity: 0, scale: 0.9 }} // Increased from 0.8
              animate={{ opacity: [0, 0.4, 0], scale: [0.9, 1.15, 0.9] }} // Reduced from [0.8, 1.2, 0.8]
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "mirror" }}
            />
          </FeedbackButton>

          <FeedbackButton
            size="lg"
            variant="outline"
            className="px-8 py-6 text-lg rounded-full flex items-center border-green-400/50 hover:bg-green-50 hover:shadow-md hover:-translate-y-1 active:translate-y-[1px] transition-all duration-300"
            loadingText="Loading demo..."
            successText="Opening demo"
            onClickAsync={async () => {
              await new Promise((resolve) => setTimeout(resolve, 600))
              scrollToHowItWorks()
              return true
            }}
          >
            <motion.div
              className="mr-2 rounded-full bg-green-100 p-1 flex items-center justify-center"
              whileHover={{ scale: 1.1, backgroundColor: "rgba(16, 185, 129, 0.2)" }} // Reduced from 1.2
              transition={{ type: "spring", stiffness: 400, damping: 15 }} // Reduced from 500
            >
              <Play className="h-4 w-4 text-green-500" />
            </motion.div>
            Watch Demo
          </FeedbackButton>
        </motion.div>
      </div>

      {/* Hero SVG / Glass effect animation container */}
      <motion.div
        initial={{ opacity: 0, y: 50, filter: "blur(4px)" }}
        animate={{
          opacity: isContentInView ? 1 : 0,
          y: isContentInView ? 0 : 50,
          filter: isContentInView ? "blur(0px)" : "blur(4px)",
        }}
        transition={{ duration: 1, delay: 1, ease: APPLE_EASING }}
        style={{
          y,
          scale,
          opacity,
          rotateX: rotate,
          transformPerspective: 1500,
          willChange: "transform, opacity",
        }}
        className="w-full max-w-5xl mx-auto mt-16 px-4 relative z-0"
      >
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          {/* Glass effect overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-green-200/10 to-transparent z-10 pointer-events-none"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          {/* Place for your main content or demo video/animation */}
        </div>
      </motion.div>

      {/* Interactive scroll indicator */}
      <ScrollIndicator scrollToFeatures={scrollToFeatures} hasScrolled={hasScrolled} />
    </div>
  )
}

export default HeroSection
