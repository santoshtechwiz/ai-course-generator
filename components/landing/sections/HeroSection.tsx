"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion"
import { ChevronDown, ArrowRight, Play } from "lucide-react"

import { FeedbackButton } from "@/components/ui/feedback-button"
import { useMobile } from "@/hooks/use-mobile"

interface HeroSectionProps {
  scrollToFeatures: () => void
  scrollToHowItWorks: () => void
}

// Apple-style easing function
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

const HeroSection = ({ scrollToFeatures, scrollToHowItWorks }: HeroSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()
  const [hasScrolled, setHasScrolled] = useState(false)
  const [isInView, setIsInView] = useState(true)

  // Parallax effects
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // Smooth spring physics for more natural animations
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    restDelta: 0.0001,
    mass: 1,
  })

  // Enhanced parallax effects
  const y = useTransform(smoothProgress, [0, 1], [0, 150])
  const scale = useTransform(smoothProgress, [0, 1], [1, 1.1])
  const opacity = useTransform(smoothProgress, [0, 0.8], [1, 0])
  const rotate = useTransform(smoothProgress, [0, 1], [0, -3])

  // Text parallax with different speeds
  const titleY = useTransform(smoothProgress, [0, 1], [0, 40])
  const subtitleY = useTransform(smoothProgress, [0, 1], [0, 60])
  const buttonsY = useTransform(smoothProgress, [0, 1], [0, 80])

  // Background parallax
  const bgY = useTransform(smoothProgress, [0, 1], [0, 30])
  const bgScale = useTransform(smoothProgress, [0, 1], [1, 1.05])

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
      { threshold: [0.1, 0.3, 0.5, 0.7] },
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

  // Optimized floating particles component
  const AppleStyleParticles = () => {
    const particleCount = isMobile ? 5 : 8

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: particleCount }).map((_, i) => {
          const size = Math.random() * 25 + 10
          const depth = Math.random() * 0.4 + 0.3
          const xPos = `${Math.random() * 100}%`
          const yPos = `${Math.random() * 100}%`

          return (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full"
              initial={{
                x: xPos,
                y: yPos,
                scale: depth,
                opacity: Math.random() * 0.2 + 0.1,
                filter: `blur(${(1 - depth) * 3}px)`,
              }}
              animate={{
                y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                rotate: [0, Math.random() * 90],
                scale: [depth, depth * (1 + Math.random() * 0.1), depth],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 5 + Math.random() * 3,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "mirror",
                ease: "linear",
                delay: i * 0.7,
              }}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                zIndex: Math.floor(depth * 10),
                willChange: "transform, opacity",
                background: `radial-gradient(circle, rgba(var(--primary-rgb), ${0.1 + depth * 0.1}) 0%, rgba(var(--primary-rgb), 0) 70%)`,
              }}
            />
          )
        })}
      </div>
    )
  }

  // Optimized title animation
  const titleAnimation = {
    hidden: { opacity: 0, y: 15, filter: "blur(3px)" },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        delay: 0.1 * i,
        duration: 0.7,
        ease: APPLE_EASING,
      },
    }),
  }

  // Scroll indicator component
  const ScrollIndicator = () => {
    return (
      <AnimatePresence>
        {!hasScrolled && (
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
                Scroll to explore
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
        )}
      </AnimatePresence>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
      style={{
        willChange: "transform, opacity",
        perspective: "1500px",
      }}
    >
      {/* Enhanced background gradient with parallax */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20 pointer-events-none"
        style={{ y: bgY, scale: bgScale }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Enhanced floating particles with 3D effect */}
      <AppleStyleParticles />

      {/* Content with staggered reveal animations */}
      <div className="container max-w-6xl mx-auto px-4 md:px-6 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: isInView ? 1 : 0,
            y: isInView ? 0 : 20,
          }}
          transition={{ duration: 0.8, ease: APPLE_EASING }}
          className="mb-6"
          style={{ y: titleY }}
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
            Introducing CourseAI
          </motion.span>
        </motion.div>

        {/* Heading with character-by-character animation */}
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
              animate={isInView ? "visible" : "hidden"}
              variants={titleAnimation}
            >
              Create Engaging{" "}
            </motion.span>
            <motion.span
              className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60"
              custom={2}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={titleAnimation}
            >
              AI-powered
            </motion.span>
            <br />
            <motion.span
              className="inline-block"
              custom={3}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={titleAnimation}
            >
              courses and quizzes
            </motion.span>
          </motion.h1>
        </div>
        <br />
        <motion.span
          className="inline-block text-xl md:text-2xl font-semibold"
          custom={4}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={titleAnimation}
        >
          From Any Topic
        </motion.span>
        <motion.p
          initial={{ opacity: 0, y: 30, filter: "blur(3px)" }}
          animate={{
            opacity: isInView ? 1 : 0,
            y: isInView ? 0 : 30,
            filter: isInView ? "blur(0px)" : "blur(3px)",
          }}
          transition={{ duration: 0.8, delay: 0.6, ease: APPLE_EASING }}
          className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10"
          style={{ y: subtitleY }}
        >
          Turn text, ideas, or content into interactive, high-quality courses—no videos required. We will build courses
          from YouTube.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(3px)" }}
          animate={{
            opacity: isInView ? 1 : 0,
            y: isInView ? 0 : 40,
            filter: isInView ? "blur(0px)" : "blur(3px)",
          }}
          transition={{ duration: 0.8, delay: 0.8, ease: APPLE_EASING }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ y: buttonsY }}
        >
          <FeedbackButton
            size="lg"
            className="px-8 py-6 text-lg rounded-full bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:translate-y-[1px]"
            loadingText="Loading features..."
            successText="Exploring features"
            onClickAsync={async () => {
              await new Promise((resolve) => setTimeout(resolve, 500))
              scrollToFeatures()
              return true
            }}
          >
            <span className="relative z-10">Explore Features</span>
            <motion.span
              className="inline-block ml-2 relative z-10"
              initial={{ x: 0 }}
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <ArrowRight className="h-5 w-5" />
            </motion.span>
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, repeatType: "mirror" }}
            />
          </FeedbackButton>

          <FeedbackButton
            size="lg"
            variant="outline"
            className="px-8 py-6 text-lg rounded-full flex items-center hover:bg-primary/5 hover:shadow-md hover:translate-y-[-2px] active:translate-y-[1px] transition-all duration-300 border-primary/20"
            loadingText="Loading demo..."
            successText="Opening demo"
            onClickAsync={async () => {
              await new Promise((resolve) => setTimeout(resolve, 500))
              scrollToHowItWorks()
              return true
            }}
          >
            <motion.div
              className="mr-2 rounded-full bg-primary/10 p-1 flex items-center justify-center"
              whileHover={{ scale: 1.1, backgroundColor: "rgba(var(--primary-rgb), 0.2)" }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Play className="h-4 w-4 text-primary" />
            </motion.div>
            Watch Demo
          </FeedbackButton>
        </motion.div>
      </div>

      {/* Hero Image with advanced 3D parallax */}
      <motion.div
        initial={{ opacity: 0, y: 40, filter: "blur(3px)" }}
        animate={{
          opacity: isInView ? 1 : 0,
          y: isInView ? 0 : 40,
          filter: isInView ? "blur(0px)" : "blur(3px)",
        }}
        transition={{ duration: 0.8, delay: 0.8, ease: APPLE_EASING }}
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
            className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent z-10 pointer-events-none"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />

          {/* Main content display with enhanced glass effect */}
          <div className="aspect-video bg-gradient-to-br from-background/80 to-muted/30 backdrop-blur-sm relative overflow-hidden">
            {/* Content creation visualization */}
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
                          ease: "easeInOut",
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
                    ease: [0.4, 0.0, 0.2, 1],
                  }}
                />
              </motion.div>
            </div>

            {/* Floating elements */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`float-${i}`}
                className="absolute rounded-lg bg-gradient-to-br from-primary/20 to-primary/5"
                style={{
                  width: 25 + Math.random() * 35,
                  height: 25 + Math.random() * 35,
                  left: `${Math.random() * 80 + 10}%`,
                  top: `${Math.random() * 80 + 10}%`,
                  filter: `blur(${Math.random() * 1}px)`,
                }}
                animate={{
                  y: [0, -10 - Math.random() * 15, 0],
                  x: [0, Math.random() * 10 - 5, 0],
                  rotate: [0, Math.random() * 15 - 7, 0],
                  scale: [1, 1 + Math.random() * 0.1, 1],
                  opacity: [0.5, 0.6, 0.5],
                }}
                transition={{
                  duration: 5 + Math.random() * 3,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: i * 0.7,
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

        {/* Add subtle glow effect */}
        <motion.div
          className="absolute inset-0 -z-10 blur-3xl rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(var(--primary-rgb), 0.12) 0%, rgba(var(--primary-rgb), 0) 70%)",
            transform: "translateY(30%) scale(1.5)",
          }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [1.5, 1.6, 1.5],
          }}
          transition={{
            duration: 7,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
          }}
        />
      </motion.div>

      {/* Enhanced scroll indicator */}
      <ScrollIndicator />
    </div>
  )
}

export default HeroSection
