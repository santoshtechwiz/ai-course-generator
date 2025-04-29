"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, useInView } from "framer-motion"
import { FileText, Sparkles, Layers, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/tailwindUtils"

// Apple-style easing function
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

// Step data
const steps = [
  {
    id: "choose",
    title: "Choose your topic",
    description: "Select any subject you want to create content about, from programming to history to cooking.",
    color: "from-blue-500 to-cyan-500",
    icon: FileText,
  },
  {
    id: "generate",
    title: "AI generates content",
    description: "Our advanced AI analyzes the topic and creates comprehensive, structured materials.",
    color: "from-purple-500 to-pink-500",
    icon: Sparkles,
  },
  {
    id: "customize",
    title: "Customize your content",
    description: "Edit, rearrange, and enhance the AI-generated content to match your specific needs.",
    color: "from-amber-500 to-orange-500",
    icon: Layers,
  },
  {
    id: "publish",
    title: "Publish and share",
    description: "Make your content available to others or keep it private for personal use.",
    color: "from-green-500 to-emerald-500",
    icon: CheckCircle,
  },
]

const HowItWorksSection = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.3 })
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)

  // Animation speed control - adjust this value to change animation speed
  // Lower values = faster animations, Higher values = slower animations
  // Default: 5000 (5 seconds per step)
  const stepDuration = 3500 // Changed to 3.5 seconds per step for faster animations

  // Handle step navigation
  const nextStep = useCallback(() => {
    setActiveStep((prev) => (prev + 1) % steps.length)
    setProgress(0)
  }, [])

  const prevStep = useCallback(() => {
    setActiveStep((prev) => (prev - 1 + steps.length) % steps.length)
    setProgress(0)
  }, [])

  const goToStep = useCallback((index: number) => {
    setActiveStep(index)
    setProgress(0)
  }, [])

  // Animation loop using requestAnimationFrame for smoother performance
  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp

      const elapsed = timestamp - lastTimeRef.current
      // Apply speed multiplier to make animations smoother with the new duration
      const newProgress = Math.min(progress + (elapsed / stepDuration) * 100 * 1.2, 100)

      setProgress(newProgress)

      if (newProgress >= 100) {
        nextStep()
        lastTimeRef.current = timestamp
      } else {
        lastTimeRef.current = timestamp
        animationRef.current = requestAnimationFrame(animate)
      }
    },
    [progress, nextStep],
  )

  // Start/stop animation based on visibility
  useEffect(() => {
    if (isInView) {
      lastTimeRef.current = 0
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isInView, animate])

  // Reset animation when step changes manually
  useEffect(() => {
    lastTimeRef.current = 0
    setProgress(0)
  }, [activeStep])

  // Content for each step
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="font-medium text-lg">Enter your topic to create a course</div>
            <div className="bg-card p-4 rounded-lg border border-border/20">
              <div className="h-8 w-full bg-primary/10 rounded-md flex items-center px-3">
                <motion.span
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: stepDuration / 1250, // Scale based on step duration
                    times: [0, 0.1, 0.9, 1],
                  }}
                  className="text-primary"
                >
                  Web Development with React
                </motion.span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {["JavaScript", "React", "Web Development", "Frontend"].map((tag) => (
                <motion.div
                  key={tag}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: Math.random() * 0.5 }}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                >
                  {tag}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )
      case 1:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="font-medium text-lg">AI is generating your course content...</div>
            <div className="space-y-3">
              {[
                "Analyzing topic requirements",
                "Gathering relevant information",
                "Structuring course outline",
                "Creating assessment questions",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * (stepDuration / 16000) }} // Scale delay based on step duration
                  className="flex items-center"
                >
                  <motion.div
                    animate={{
                      scale: progress / 100 > (i + 1) / 4 ? [1, 1.2, 1] : 1,
                      backgroundColor: progress / 100 > (i + 1) / 4 ? "rgb(var(--primary))" : "rgb(var(--muted))",
                    }}
                    transition={{ repeat: progress / 100 > (i + 1) / 4 ? Number.POSITIVE_INFINITY : 0, duration: 1 }}
                    className="w-4 h-4 rounded-full mr-3 flex items-center justify-center bg-muted"
                  >
                    {progress / 100 > (i + 1) / 4 && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                  </motion.div>
                  <span className={progress / 100 > (i + 1) / 4 ? "font-medium" : "text-muted-foreground"}>{item}</span>
                </motion.div>
              ))}
            </div>
            <motion.div className="h-2 mt-6 rounded-full bg-primary/20" style={{ overflow: "hidden" }}>
              <motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </motion.div>
          </motion.div>
        )
      case 2:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="font-medium text-lg">Customize your course structure</div>
            <div className="space-y-2">
              {[
                "Introduction to React",
                "Components & Props",
                "State & Lifecycle",
                "Hooks",
                "Routing",
                "API Integration",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * (stepDuration / 50000) }} // Scale delay based on step duration
                  className="bg-card p-3 rounded-lg border border-border/20 flex items-center"
                  style={{
                    transform: i === Math.floor(progress / 20) ? "scale(1.03)" : "scale(1)",
                    boxShadow: i === Math.floor(progress / 20) ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <div className="mr-3 text-muted-foreground">{i + 1}.</div>
                  <div className="flex-grow">{item}</div>
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: progress > 50 ? 1 : 0.8 }}
              className="w-16 h-16 mx-auto rounded-full bg-green-500 text-white flex items-center justify-center"
            >
              <CheckCircle className="h-8 w-8" />
            </motion.div>
            <div className="font-medium text-lg">
              {progress < 50 ? "Publishing your course..." : "Course Published!"}
            </div>
            <motion.div className="h-2 rounded-full bg-primary/20 max-w-xs mx-auto" style={{ overflow: "hidden" }}>
              <motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </motion.div>

            {progress > 70 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-2">
                <div className="text-muted-foreground">Share your course:</div>
                <div className="flex justify-center space-x-2">
                  {["Copy Link", "Email", "Twitter", "Facebook"].map((platform, i) => (
                    <motion.div
                      key={platform}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * (stepDuration / 50000) }} // Scale delay based on step duration
                      className="px-3 py-1 rounded-full bg-card border border-border/20 text-sm cursor-pointer"
                    >
                      {platform}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6 py-16" ref={containerRef}>
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: APPLE_EASING }}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          How It Works
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: APPLE_EASING }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Create a course or quiz in minutes
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: APPLE_EASING }}
          className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
        >
          Whether you're an educator, a professional, or a hobbyist, our platform empowers you to create engaging and
          interactive content effortlessly.
        </motion.p>
      </div>

      {/* Step Navigation */}
      <div className="relative max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.div whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }} className="hidden md:block">
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
            {/* Progress bar */}
            <div
              className="relative h-2 bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <motion.div
                className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${steps[activeStep].color}`}
                style={{ width: `${progress}%` }}
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
                  <motion.div
                    className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2",
                      index === activeStep
                        ? `bg-gradient-to-br ${step.color} text-white shadow-lg`
                        : index < activeStep
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground",
                    )}
                    animate={
                      index === activeStep
                        ? {
                            scale: [1, 1.05, 1],
                          }
                        : {}
                    }
                    transition={{
                      repeat: index === activeStep ? Number.POSITIVE_INFINITY : 0,
                      repeatType: "reverse",
                      duration: stepDuration / 2500, // Scale duration based on step duration
                    }}
                  >
                    {index < activeStep ? <CheckCircle className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                  </motion.div>
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

          <motion.div whileHover={{ scale: 1.05, x: 2 }} whileTap={{ scale: 0.95 }} className="hidden md:block">
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

        {/* Main Content Area */}
        <motion.div
          className="relative bg-card/30 backdrop-blur-sm rounded-2xl p-6 md:p-10 border border-border/10 shadow-lg overflow-hidden"
          style={{ minHeight: "400px" }}
          layout
        >
          {/* Background gradient */}
          <motion.div
            className={`absolute inset-0 opacity-10 bg-gradient-to-br ${steps[activeStep].color}`}
            animate={{ opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
            aria-hidden="true"
          />

          {/* Step Content */}
          <motion.div
            key={`step-${activeStep}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: APPLE_EASING }}
            className="relative z-10"
          >
            <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
              <div className="md:w-1/2">
                <motion.div
                  className={`inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br ${steps[activeStep].color} text-white text-2xl font-bold mb-6 relative z-10 shadow-lg`}
                  animate={{
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                >
                  {React.createElement(steps[activeStep].icon, { className: "h-8 w-8" })}
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
                      animate={{ x: [0, 3, 0] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: stepDuration / 3500 }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.span>
                  </Button>
                </div>
              </div>

              <div className="md:w-1/2">
                <div className="bg-background/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-border/20">
                  <div className="flex items-center mb-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="ml-4 text-sm font-medium">Step {activeStep + 1}</div>
                  </div>

                  {getStepContent(activeStep)}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

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

export default HowItWorksSection
