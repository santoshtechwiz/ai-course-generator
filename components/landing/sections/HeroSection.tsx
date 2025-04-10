"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion"
import { ChevronDown, ArrowRight, Play } from "lucide-react"

import { useMobile } from "@/hooks/use-mobile"
import { FeedbackButton } from "@/components/ui/feedback-button"

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

  // Simulate async actions for demo purposes
  const handleExploreFeatures = async () => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    scrollToFeatures()
    return true
  }

  const handleWatchDemo = async () => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    scrollToHowItWorks()
    return true
  }

  // Update the hero section for better visual appeal and performance
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
              Create and share with{" "}
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
              interactive experiences
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
          Transform your ideas into engaging content with AI-generated materials, interactive elements, and personalized
          experiences that captivate your audience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ y: buttonsY }}
        >
          <FeedbackButton
            size="lg"
            className="px-8 py-6 text-lg rounded-full bg-primary hover:bg-primary/90 transition-all shadow-lg"
            loadingText="Loading features..."
            successText="Exploring features"
            onClickAsync={handleExploreFeatures}
          >
            Explore Features
            <motion.span
              className="inline-block ml-2"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <ArrowRight className="h-5 w-5" />
            </motion.span>
          </FeedbackButton>

          <FeedbackButton
            size="lg"
            variant="outline"
            className="px-8 py-6 text-lg rounded-full flex items-center"
            loadingText="Loading demo..."
            successText="Opening demo"
            onClickAsync={handleWatchDemo}
          >
            <Play className="h-5 w-5 mr-2" />
            Watch Demo
          </FeedbackButton>
        </motion.div>
      </div>

      {/* Hero Image with advanced 3D parallax */}
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
          {/* Main content display */}
          <div className="aspect-video bg-gradient-to-br from-background/80 to-muted/30 backdrop-blur-sm relative overflow-hidden">
            {/* Content creation visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-4/5 h-4/5 rounded-xl bg-background/40 backdrop-blur-md border border-primary/10 p-6 flex flex-col"
                animate={{
                  y: [0, -5, 0],
                  boxShadow: [
                    "0 0 0 0 rgba(var(--primary-rgb), 0)",
                    "0 20px 50px -12px rgba(var(--primary-rgb), 0.15)",
                    "0 0 0 0 rgba(var(--primary-rgb), 0)",
                  ],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                {/* Simulated content creation interface */}
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="ml-auto flex space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-6 h-2 rounded-full bg-primary/20"
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.3,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Content blocks */}
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
                      animate={{ height: ["7rem", "5rem", "7rem"] }}
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

                  <motion.div
                    className="h-4 w-1/2 bg-primary/10 rounded-md"
                    animate={{ width: ["40%", "55%", "40%"] }}
                    transition={{
                      duration: 7,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                  />

                  <motion.div
                    className="h-20 w-full bg-primary/5 rounded-md"
                    animate={{ height: ["5rem", "6rem", "5rem"] }}
                    transition={{
                      duration: 12,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                  />
                </div>

                {/* Animated cursor */}
                <motion.div
                  className="absolute w-3 h-3 rounded-full bg-primary"
                  animate={{
                    x: [100, 300, 200, 400, 100],
                    y: [100, 150, 250, 180, 100],
                    scale: [1, 1.2, 1, 0.8, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 15,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    ease: "linear",
                  }}
                />
              </motion.div>
            </div>

            {/* Floating elements */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`float-${i}`}
                className="absolute rounded-lg bg-gradient-to-br from-primary/20 to-primary/5"
                style={{
                  width: 30 + Math.random() * 60,
                  height: 30 + Math.random() * 60,
                  left: `${Math.random() * 80 + 10}%`,
                  top: `${Math.random() * 80 + 10}%`,
                }}
                animate={{
                  y: [0, -20 - Math.random() * 30, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  rotate: [0, Math.random() * 30 - 15, 0],
                  scale: [1, 1 + Math.random() * 0.2, 1],
                }}
                transition={{
                  duration: 5 + Math.random() * 5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
              />
            ))}

            {/* Enhanced reflection effect */}
            <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-white/20 to-transparent transform scale-y-[-1] blur-sm opacity-30"></div>

            {/* Apple-style highlight effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.2, 0] }}
              transition={{
                duration: 5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          </div>
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

// Optimize the particles animation for better performance
const AppleStyleParticles = () => {
  const isMobile = useMobile()
  const particleCount = isMobile ? 10 : 20 // Reduce count on mobile for better performance

  return (
    <>
      {Array.from({ length: particleCount }).map((_, i) => {
        const size = Math.random() * 35 + 5
        const depth = Math.random() * 0.7 + 0.3

        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-gradient-to-br from-primary/10 to-primary/5"
            initial={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              scale: depth,
              opacity: Math.random() * 0.5 + 0.1,
              filter: `blur(${(1 - depth) * 5}px)`,
            }}
            animate={{
              y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
              x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
              rotate: [0, Math.random() * 360],
              scale: [depth, depth * (1 + Math.random() * 0.2), depth],
            }}
            transition={{
              duration: Math.random() * 30 + 20,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "linear",
            }}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              zIndex: Math.floor(depth * 10),
              willChange: "transform, opacity",
            }}
          />
        )
      })}
    </>
  )
}

export default HeroSection
