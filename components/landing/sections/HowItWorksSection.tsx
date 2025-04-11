"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence, useInView, useAnimation } from "framer-motion"
import { FileText, Sparkles, Layers, CheckCircle, ChevronRight, ChevronLeft, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import React from "react"
import HowItWorksSVG from "../svg/HowItWorksSVG" // Import the HowItWorksSVG component

const steps = [
  {
    id: "choose",
    icon: FileText,
    title: "Choose your topic",
    description: "Select any subject you want to create content about, from programming to history to cooking.",
    color: "from-blue-500 to-cyan-500",
    animation: "typing",
  },
  {
    id: "generate",
    icon: Sparkles,
    title: "AI generates content",
    description: "Our advanced AI analyzes the topic and creates comprehensive, structured materials.",
    color: "from-purple-500 to-pink-500",
    animation: "processing",
  },
  {
    id: "customize",
    icon: Layers,
    title: "Customize your content",
    description: "Edit, rearrange, and enhance the AI-generated content to match your specific needs.",
    color: "from-amber-500 to-orange-500",
    animation: "arranging",
  },
  {
    id: "publish",
    icon: CheckCircle,
    title: "Publish and share",
    description: "Make your content available to others or keep it private for personal use.",
    color: "from-green-500 to-emerald-500",
    animation: "publishing",
  },
]

const APPLE_EASING = [0.25, 0.1, 0.25, 1]

// Optimize the animation variants for better performance
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 }, // Reduced y-offset and scale for better performance
  visible: (delay) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6, // Reduced from 0.7 for better performance
      delay,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
  hover: {
    y: -5, // Reduced from -16 for better performance
    scale: 1.02, // Reduced from 1.03 for better performance
    boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.1)", // Reduced shadow for better performance
    transition: {
      duration: 0.3, // Reduced from 0.5 for better performance
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

const HowItWorksSection = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.3 })
  const controls = useAnimation()
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Handle step navigation
  const goToStep = (index: number) => {
    setActiveStep(index)
    setProgress(0)
  }

  const nextStep = () => {
    goToStep((activeStep + 1) % steps.length)
  }

  const prevStep = () => {
    goToStep((activeStep - 1 + steps.length) % steps.length)
  }

  // Auto-advance functionality
  useEffect(() => {
    if (!isInView || !isAutoPlaying) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
        progressInterval.current = null
      }
      return
    }

    const duration = 6000 // 6 seconds per step
    const updateInterval = 30 // Update progress every 30ms for smoother animation

    const startTime = Date.now()

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / duration) * 100, 100)
      setProgress(newProgress)

      if (elapsed >= duration) {
        nextStep()
      }
    }, updateInterval)

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [activeStep, isInView, isAutoPlaying])

  // Start animations when section comes into view
  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    } else {
      controls.start("hidden")
      setActiveStep(0)
      setProgress(0)
    }
  }, [isInView, controls])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextStep()
      } else if (e.key === "ArrowLeft") {
        prevStep()
      } else if (e.key === " ") {
        // Space bar toggles autoplay
        setIsAutoPlaying(!isAutoPlaying)
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isAutoPlaying])

  // Optimize the handleScroll function to use requestAnimationFrame
  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const handleScroll = () => {
      lastScrollY = window.scrollY

      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollTop(lastScrollY > 500)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6" ref={containerRef}>
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          How It Works
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Create a course or quiz in minutes
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
        >
          Whether you're an educator, a professional, or a hobbyist, our platform empowers you to create engaging and
          interactive content effortlessly.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Why spend on expensive courses? Create your own interactive quizzes and content to learn effectively and
          affordably.
        </motion.p>
      </div>

   

      {/* Interactive Process Viewer */}
      <div className="relative max-w-5xl mx-auto">
        {/* Step Navigation */}
        <div className="flex justify-between items-center mb-8">
          <motion.div whileHover={{ scale: 1.1, x: -3 }} whileTap={{ scale: 0.95 }} className="hidden md:block">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
              onClick={prevStep}
              aria-label="Previous step"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </motion.div>

          <div className="flex-1 mx-4">
            <div
              className="relative h-2 bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label="Step progress"
            >
              <motion.div
                className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${steps[activeStep].color}`}
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
            <div className="flex justify-between mt-4">
              {steps.map((step, index) => (
                <motion.button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={cn(
                    "flex flex-col items-center transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-lg p-1",
                    index === activeStep ? "scale-110" : "scale-100 opacity-70 hover:opacity-100",
                  )}
                  whileHover={{ scale: index === activeStep ? 1.1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`Go to step ${index + 1}: ${step.title}`}
                  aria-current={index === activeStep ? "step" : undefined}
                >
                  <div
                    className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2",
                      index === activeStep
                        ? `bg-gradient-to-br ${step.color} text-white shadow-lg`
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {index < activeStep ? (
                      <CheckCircle className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <motion.div
                        animate={
                          index === activeStep
                            ? {
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, -10, 0],
                              }
                            : {}
                        }
                        transition={{
                          repeat: index === activeStep ? Number.POSITIVE_INFINITY : 0,
                          repeatType: "loop",
                          duration: 3,
                        }}
                      >
                        <step.icon className="h-5 w-5" aria-hidden="true" />
                      </motion.div>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs md:text-sm font-medium text-center hidden md:block",
                      index === activeStep ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.1, x: 3 }} whileTap={{ scale: 0.95 }} className="hidden md:block">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
              onClick={nextStep}
              aria-label="Next step"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        {/* Main Animation Area */}
        <div
          className="relative bg-card/30 backdrop-blur-sm rounded-2xl p-6 md:p-10 border border-border/10 shadow-lg overflow-hidden"
          style={{ minHeight: "500px" }}
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
          role="region"
          aria-label={`Step ${activeStep + 1}: ${steps[activeStep].title}`}
        >
          {/* Background gradient */}
          <motion.div
            className={`absolute inset-0 opacity-10 bg-gradient-to-br ${steps[activeStep].color}`}
            animate={{ opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
            aria-hidden="true"
          />

          {/* SVG Background Illustration */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <HowItWorksSVG />
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`step-${activeStep}`}
              initial={{ opacity: 0, y: 30, rotateX: 5 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -30, rotateX: -5 }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative z-10"
              style={{ transformPerspective: "1200px" }}
            >
              <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
                <div className="md:w-1/2">
                  <motion.div
                    className={`inline-flex items-center justify-center w-18 h-18 rounded-full bg-gradient-to-br ${steps[activeStep].color} text-white text-2xl font-bold mb-6 relative z-10 shadow-lg`}
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                      ease: APPLE_EASING,
                    }}
                    aria-hidden="true"
                  >
                    {React.createElement(steps[activeStep].icon, { className: "h-9 w-9" })}
                  </motion.div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">{steps[activeStep].title}</h3>
                  <p className="text-muted-foreground text-lg mb-6 leading-relaxed">{steps[activeStep].description}</p>

                  <div className="flex space-x-4">
                    <Button
                      variant="default"
                      className={`rounded-full bg-gradient-to-r ${steps[activeStep].color} text-white border-none px-6 py-2`}
                      onClick={nextStep}
                    >
                      {activeStep === steps.length - 1 ? "Get Started" : "Next Step"}
                      <motion.span
                        className="inline-block ml-2"
                        initial={{ x: 0 }}
                        whileHover={{ x: 3 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.span>
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      aria-label={isAutoPlaying ? "Pause animation" : "Play animation"}
                      aria-pressed={isAutoPlaying}
                    >
                      {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="md:w-1/2">
                  {/* Step-specific animations with enhanced effects */}
                  <AnimationRenderer step={steps[activeStep]} isActive={isInView && isAutoPlaying} />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Navigation */}
        <div className="flex justify-between mt-6 md:hidden">
          <Button variant="outline" size="sm" onClick={prevStep} className="rounded-full">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={nextStep} className="rounded-full">
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Optimize the AnimationRenderer component to use React.memo
const AnimationRenderer = React.memo(
  ({ step, isActive }: { step: (typeof steps)[0]; isActive: boolean }) => {
    switch (step.id) {
      case "choose":
        return <TypingAnimation isActive={isActive} />
      case "generate":
        return <ProcessingAnimation isActive={isActive} color={step.color} />
      case "customize":
        return <ArrangingAnimation isActive={isActive} color={step.color} />
      case "publish":
        return <PublishingAnimation isActive={isActive} color={step.color} />
      default:
        return null
    }
  },
  (prevProps, nextProps) => {
    // Only re-render if step.id changes or isActive changes
    return prevProps.step.id === nextProps.step.id && prevProps.isActive === nextProps.isActive
  },
)

// Optimize the TypingAnimation component for better performance
const TypingAnimation = ({ isActive }: { isActive: boolean }) => {
  const [text, setText] = useState("")
  const fullText = "Master Web Development with JavaScript, React, and Node.js"
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isActive) {
      setText(fullText)
      return
    }

    let currentIndex = 0

    const type = () => {
      if (currentIndex <= fullText.length) {
        setText(fullText.substring(0, currentIndex))
        currentIndex++
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current)

        // Reset after a pause
        const resetTimer = setTimeout(() => {
          setText("")
          currentIndex = 0
          intervalRef.current = setInterval(type, 100)
        }, 2000)

        return () => clearTimeout(resetTimer)
      }
    }

    intervalRef.current = setInterval(type, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, fullText])

  // Memoize the blinking cursor to prevent unnecessary re-renders
  const blinkingCursor = useMemo(
    () => (
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8 }}
        className="inline-block w-2 h-5 bg-primary ml-1"
      />
    ),
    [],
  )

  return (
    <div className="bg-background/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-border/20">
      <div className="flex items-center mb-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="ml-4 text-sm font-medium">Course Topic</div>
      </div>

      <div className="font-mono text-lg mb-4 min-h-[100px]">
        {text}
        {blinkingCursor}
      </div>

      <div className="flex flex-wrap gap-2 mt-6">
        {["JavaScript", "React", "Node.js", "HTML", "CSS"].map((tag, index) => (
          <motion.div
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 + 0.5 }}
            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
          >
            {tag}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Animation for the "AI generates content" step
const ProcessingAnimation = ({ isActive, color }: { isActive: boolean; color: string }) => {
  return (
    <div className="bg-background/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-border/20">
      <div className="text-center mb-6">
        <motion.div
          animate={
            isActive
              ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }
              : {}
          }
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${color} text-white shadow-lg`}
        >
          <Sparkles className="h-10 w-10" />
        </motion.div>
        <h4 className="text-xl font-semibold mt-4">AI Processing</h4>
      </div>

      <div className="space-y-4">
        {[
          "Analyzing topic requirements...",
          "Gathering relevant information...",
          "Structuring course outline...",
          "Generating learning objectives...",
          "Creating assessment questions...",
        ].map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={isActive ? { opacity: 1, x: 0 } : { opacity: index < 3 ? 1 : 0.3, x: 0 }}
            transition={{ delay: isActive ? index * 0.5 : 0 }}
            className="flex items-center"
          >
            <motion.div
              animate={
                isActive && index === Math.min(Math.floor(Date.now() / 1000) % 5, 4) ? { scale: [1, 1.2, 1] } : {}
              }
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
              className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${
                index < Math.min(Math.floor(Date.now() / 1000) % 6, 5)
                  ? `bg-gradient-to-br ${color} text-white`
                  : "bg-muted"
              }`}
            >
              {index < Math.min(Math.floor(Date.now() / 1000) % 6, 5) && <CheckCircle className="h-3 w-3" />}
            </motion.div>
            <span
              className={
                index === Math.min(Math.floor(Date.now() / 1000) % 5, 4) && isActive
                  ? "font-medium"
                  : "text-muted-foreground"
              }
            >
              {step}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ width: "0%" }}
        animate={isActive ? { width: "100%" } : { width: "60%" }}
        transition={{
          duration: 5,
          repeat: isActive ? Number.POSITIVE_INFINITY : 0,
          repeatType: "loop",
        }}
        className={`h-2 mt-6 rounded-full bg-gradient-to-r ${color}`}
      ></motion.div>
    </div>
  )
}

// Animation for the "Customize your course" step
const ArrangingAnimation = ({ isActive, color }: { isActive: boolean; color: string }) => {
  const items = [
    "Introduction to Web Development",
    "HTML Fundamentals",
    "CSS Styling",
    "JavaScript Basics",
    "DOM Manipulation",
    "Responsive Design",
  ]

  const [arrangedItems, setArrangedItems] = useState([...items])

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      // Randomly swap two items
      const newArrangement = [...arrangedItems]
      const index1 = Math.floor(Math.random() * items.length)
      let index2 = Math.floor(Math.random() * items.length)
      while (index2 === index1) {
        index2 = Math.floor(Math.random() * items.length)
      }

      const temp = newArrangement[index1]
      newArrangement[index1] = newArrangement[index2]
      newArrangement[index2] = temp

      setArrangedItems(newArrangement)
    }, 2000)

    return () => clearInterval(interval)
  }, [isActive, arrangedItems])

  return (
    <div className="bg-background/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-border/20">
      <h4 className="text-xl font-semibold mb-4">Course Structure</h4>

      <div className="space-y-2">
        {arrangedItems.map((item, index) => (
          <motion.div
            key={item}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: index * 0.1,
            }}
            className="bg-card p-3 rounded-lg border border-border/20 cursor-move flex items-center"
            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="mr-3 text-muted-foreground">{index + 1}.</div>
            <div className="flex-grow">{item}</div>
            <motion.div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
            >
              <Layers className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <div className="flex space-x-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1 rounded-full bg-gradient-to-r ${color} text-white text-sm font-medium`}
          >
            Add Section
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium"
          >
            Edit
          </motion.div>
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium"
        >
          Preview
        </motion.div>
      </div>
    </div>
  )
}

// Animation for the "Publish and share" step
const PublishingAnimation = ({ isActive, color }: { isActive: boolean; color: string }) => {
  const [published, setPublished] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setPublished(false)
      return
    }

    const timer = setTimeout(() => {
      setPublished(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [isActive])

  return (
    <div className="bg-background/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-border/20">
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <motion.div
            animate={
              published
                ? {
                    scale: [1, 1.5, 1],
                    opacity: [0, 1, 1],
                  }
                : isActive
                  ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }
                  : {}
            }
            transition={{
              duration: published ? 0.8 : 2,
              repeat: published ? 0 : Number.POSITIVE_INFINITY,
              repeatType: "loop",
            }}
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
              published ? `bg-gradient-to-br ${color} text-white shadow-lg` : "bg-muted text-muted-foreground"
            }`}
          >
            <CheckCircle className="h-10 w-10" />
          </motion.div>
        </motion.div>

        <h4 className="text-xl font-semibold">{published ? "Course Published!" : "Publishing Course..."}</h4>

        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: published ? "100%" : isActive ? "100%" : "0%" }}
          transition={{ duration: published ? 0 : 2 }}
          className={`h-2 mt-4 mx-auto max-w-xs rounded-full bg-gradient-to-r ${color}`}
        ></motion.div>
      </div>

      <AnimatePresence>
        {published && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 space-y-4"
          >
            <div className="text-center text-muted-foreground mb-4">Share your course with others:</div>

            <div className="flex justify-center space-x-3">
              {["Copy Link", "Email", "Twitter", "Facebook"].map((platform, index) => (
                <motion.div
                  key={platform}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-full bg-card border border-border/20 text-sm font-medium cursor-pointer"
                >
                  {platform}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 p-4 rounded-lg bg-primary/10 text-primary text-center"
            >
              <span className="font-medium">Pro Tip:</span> Track engagement and gather feedback to improve your course!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default HowItWorksSection
