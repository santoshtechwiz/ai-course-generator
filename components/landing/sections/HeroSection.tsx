"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion"
import { ChevronDown, ArrowRight, Play } from "lucide-react"

import { useMobile } from "@/hooks/use-mobile"

interface HeroSectionProps {
  scrollToFeatures: () => void
  scrollToHowItWorks: () => void
}
const APPLE_EASING = [0.25, 0.1, 0.25, 1]
const HeroSection = ({ scrollToFeatures, scrollToHowItWorks }: HeroSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()
  const [hasScrolled, setHasScrolled] = useState(false)
  const [isInView, setIsInView] = useState(true)

  // Parallax effects with improved smoothness
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // Use spring for smoother animations
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })



  // Update the hero section animations for a more Apple-like feel

  // Replace the existing parallax effects with these enhanced ones
  const y = useTransform(smoothProgress, [0, 1], [0, 180])
  const scale = useTransform(smoothProgress, [0, 1], [1, 1.08])
  const opacity = useTransform(smoothProgress, [0, 0.8], [1, 0])
  const rotate = useTransform(smoothProgress, [0, 1], [0, -3])

  // Update the text parallax for smoother movement
  const titleY = useTransform(smoothProgress, [0, 1], [0, 80])
  const subtitleY = useTransform(smoothProgress, [0, 1], [0, 120])
  const buttonsY = useTransform(smoothProgress, [0, 1], [0, 160])

  // Enhance the background parallax
  const bgY = useTransform(smoothProgress, [0, 1], [0, 40])
  const bgScale = useTransform(smoothProgress, [0, 1], [1, 1.04])

  // Check if user has scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50 && !hasScrolled) {
        setHasScrolled(true)
      }
    }

    // Check if element is in viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.1 },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [hasScrolled])

  // Text animation variants
  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 * i,
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    }),
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
      style={{
        willChange: "transform, opacity",
        perspective: "1000px",
      }}
    >
      {/* Background gradient with parallax */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20 pointer-events-none"
        style={{ y: bgY, scale: bgScale }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* Enhanced floating particles with 3D effect */}
      <AppleStyleParticles />

      {/* Content with staggered reveal animations */}
      <div className="container max-w-6xl mx-auto px-4 md:px-6 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-6"
          style={{ y: titleY }}
        >
          <motion.span
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Introducing CourseAI
          </motion.span>
        </motion.div>

        {/* Heading with character-by-character animation */}
        <div className="overflow-hidden">
          {/* Update the title animation for a more dramatic reveal */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto"
            style={{ y: titleY }}
          >
            <motion.span
              className="inline-block"
              custom={1}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: (i) => ({
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: 0.1 * i,
                    duration: 0.9,
                    ease: APPLE_EASING,
                  },
                }),
              }}
            >
              Learn anything with{" "}
            </motion.span>
            <motion.span
              className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60"
              custom={2}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: (i) => ({
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: 0.1 * i,
                    duration: 0.9,
                    ease: APPLE_EASING,
                  },
                }),
              }}
            >
              AI-powered
            </motion.span>
            <br />
            <motion.span
              className="inline-block"
              custom={3}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: (i) => ({
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: 0.1 * i,
                    duration: 0.9,
                    ease: APPLE_EASING,
                  },
                }),
              }}
            >
              course creation
            </motion.span>
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10"
          style={{ y: subtitleY }}
        >
          Transform your knowledge into engaging courses with AI-generated content, interactive quizzes, and
          personalized learning paths.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ y: buttonsY }}
        >
          <AppleButton onClick={scrollToFeatures} isPrimary={true}>
            Get Started
            <motion.span
              className="inline-block ml-2"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <ArrowRight className="h-5 w-5" />
            </motion.span>
          </AppleButton>

          <AppleButton onClick={scrollToHowItWorks} isPrimary={false}>
            <Play className="h-5 w-5 mr-2" />
            Watch Demo
          </AppleButton>
        </motion.div>
      </div>

      {/* Hero Video/Image with advanced 3D parallax */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          y,
          scale,
          opacity,
          rotateX: rotate,
          transformPerspective: 1000,
          willChange: "transform, opacity",
        }}
        className="w-full max-w-5xl mx-auto mt-16 px-4 relative z-0"
      >
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          {/* Enhanced reflection effect */}
          <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-gradient-to-t from-white/10 to-transparent transform scale-y-[-1] blur-sm opacity-30"></div>

          {/* Apple-style highlight effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.1, 0] }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>

      {/* Enhanced scroll indicator with Apple-style animation */}
      <AnimatePresence>
        {!hasScrolled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.8, delay: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
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
            <motion.div className="flex flex-col items-center">
              <motion.span
                className="text-sm text-muted-foreground mb-2"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                Scroll to explore
              </motion.span>
              <motion.div
                className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/5"
                animate={{
                  y: [0, 10, 0],
                  boxShadow: [
                    "0 0 0 0 rgba(var(--primary-rgb), 0)",
                    "0 0 0 3px rgba(var(--primary-rgb), 0.1)",
                    "0 0 0 0 rgba(var(--primary-rgb), 0)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <ChevronDown className="h-5 w-5 text-primary" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Enhance the AppleButton component with more refined hover effects
const AppleButton = ({
  children,
  onClick,
  isPrimary = false,
}: {
  children: React.ReactNode
  onClick: () => void
  isPrimary?: boolean
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={`
        px-8 py-6 text-lg rounded-full flex items-center justify-center
        ${
          isPrimary
            ? "bg-primary text-primary-foreground shadow-lg"
            : "bg-transparent border border-primary/20 text-foreground"
        }
      `}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{
        scale: 1.05,
        boxShadow: isPrimary
          ? "0 10px 25px -5px rgba(var(--primary-rgb), 0.35)"
          : "0 10px 25px -5px rgba(0, 0, 0, 0.12)",
        y: -2,
      }}
      whileTap={{ scale: 0.98, y: 0 }}
      transition={{
        duration: 0.3,
        ease: APPLE_EASING,
      }}
    >
      {children}
    </motion.button>
  )
}

// Enhance the particles animation for a more premium feel
const AppleStyleParticles = () => {
  const isMobile = useMobile()
  const particleCount = isMobile ? 10 : 20

  return (
    <>
      {Array.from({ length: particleCount }).map((_, i) => {
        const size = Math.random() * 25 + 5
        const depth = Math.random() * 0.6 + 0.4 // For 3D effect

        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-primary/10"
            initial={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              scale: depth,
              opacity: Math.random() * 0.4 + 0.1,
              filter: `blur(${(1 - depth) * 4}px)`, // Blurrier if further away
            }}
            animate={{
              y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
              x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
              rotate: [0, Math.random() * 360], // Subtle rotation
            }}
            transition={{
              duration: Math.random() * 25 + 15,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "linear",
            }}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              zIndex: Math.floor(depth * 10), // 3D layering effect
              willChange: "transform, opacity",
            }}
          />
        )
      })}
    </>
  )
}

export default HeroSection
