"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, useInView } from "framer-motion"
import { FileText, Sparkles, Layers, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Apple-style easing function
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

// Step data
const steps = [
  {
    id: "upload",
    title: "Enter course title",
    description: "Simply enter a title for your course. CourseAI will help you build a structured learning experience around your chosen topic.",
    icon: FileText,
  },
  {
    id: "structure",
    title: "Add YouTube videos",
    description: "Add YouTube video links to your course. CourseAI will organize them into chapters and create a logical learning path.",
    icon: Layers,
  },
  {
    id: "generate",
    title: "Generate quizzes",
    description: "Use AI to automatically create quizzes from YouTube video transcripts. Generate multiple-choice, coding, and open-ended questions.",
    icon: Sparkles,
  },
  {
    id: "share",
    title: "Share & track progress",
    description: "Share your course with learners and monitor their progress. Track quiz performance and engagement with detailed analytics.",
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

  // Animation speed control
  const stepDuration = 4000

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

  // Animation loop
  const animate = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp

      const elapsed = timestamp - lastTimeRef.current
      const newProgress = Math.min(progress + (elapsed / stepDuration) * 100, 100)

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
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="space-y-4"
          >
            <div className="font-medium text-lg">Enter a course title</div>
            <div className="bg-card p-4 rounded-lg border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))]">
              <div className="flex items-center justify-center h-20 border-2 border-dashed border-border rounded-lg">
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 2,
                  }}
                  className="text-center"
                >
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <span className="text-sm text-muted-foreground">Enter course title</span>
                </motion.div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {["MP4", "MOV", "AVI", "WebM"].map((format) => (
                <motion.div
                  key={format}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: Math.random() * 0.3 }}
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border-2 border-primary/20"
                >
                  {format}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="space-y-4"
          >
            <div className="font-medium text-lg">Add YouTube video links</div>
            <div className="space-y-3">
              {[
                "Course Introduction",
                "Chapter 1: Getting Started",
                "Chapter 2: Core Concepts",
                "Chapter 3: Advanced Topics",
                "Final Assessment",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "bg-card p-4 rounded-lg border-3 border-border flex items-center transition-all duration-200",
                    i === Math.floor(progress / 25) 
                      ? "shadow-[4px_4px_0px_0px_hsl(var(--primary))] border-primary/50" 
                      : "shadow-[4px_4px_0px_0px_hsl(var(--border))]"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center mr-3 border-2 border-primary/20">
                    {i + 1}
                  </div>
                  <div className="flex-grow font-medium">{item}</div>
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="space-y-4"
          >
            <div className="font-medium text-lg">AI generates quizzes from YouTube transcripts</div>
            <div className="space-y-3">
              {[
                "Analyzing video transcripts",
                "Generating multiple-choice questions",
                "Creating coding challenges",
                "Adding open-ended questions",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex items-center"
                >
                  <motion.div
                    animate={{
                      scale: progress / 100 > (i + 1) / 4 ? [1, 1.1, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "w-5 h-5 rounded-full mr-3 flex items-center justify-center border-2",
                      progress / 100 > (i + 1) / 4 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "bg-muted border-border"
                    )}
                  >
                    {progress / 100 > (i + 1) / 4 && <CheckCircle className="h-3 w-3" />}
                  </motion.div>
                  <span className={cn(
                    "text-sm",
                    progress / 100 > (i + 1) / 4 ? "font-medium text-foreground" : "text-muted-foreground"
                  )}>
                    {item}
                  </span>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 p-1 bg-card rounded-lg border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))]">
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        )
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: progress > 50 ? 1 : 0.9 }}
              className="w-20 h-20 mx-auto rounded-2xl bg-primary text-primary-foreground flex items-center justify-center border-4 border-border shadow-[8px_8px_0px_0px_hsl(var(--border))]"
            >
              <CheckCircle className="h-10 w-10" />
            </motion.div>
            <div className="font-bold text-xl">
              {progress < 50 ? "Setting up your course..." : "Course Ready to Share!"}
            </div>
            
            <div className="p-1 bg-card rounded-lg border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] max-w-xs mx-auto">
              <div className="h-4 rounded-full bg-muted overflow-hidden">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {progress > 70 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-3"
              >
                <div className="text-muted-foreground font-medium">Share your course:</div>
                <div className="flex justify-center flex-wrap gap-2">
                  {["Copy Link", "Email", "Facebook", "LinkedIn"].map((platform, i) => (
                    <motion.div
                      key={platform}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="px-4 py-2 rounded-lg bg-card border-3 border-border text-sm font-medium cursor-pointer shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:shadow-[4px_4px_0px_0px_hsl(var(--primary))] hover:border-primary/50 transition-all duration-200"
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
    <section className="w-full py-16 md:py-24 bg-background" ref={containerRef}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: APPLE_EASING }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-black border-3 border-primary/20 shadow-[3px_3px_0px_0px_hsl(var(--border))] mb-6"
        >
          <Sparkles className="h-4 w-4" />
          How It Works
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: APPLE_EASING }}
          className="text-4xl md:text-6xl font-black mb-6"
        >
          From idea to
          <br />
          <span className="text-primary">
            extraordinary course
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: APPLE_EASING }}
          className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
        >
          Creating exceptional educational content has never been this simple.
          Our intelligent platform handles the complexity while you focus on
          what matters most—sharing your knowledge and inspiring others.
        </motion.p>
      </div>

      {/* Step Navigation */}
      <div className="relative max-w-5xl mx-auto px-4">
        <div className="flex flex-col gap-8 mb-12">
          {/* Progress bar */}
          <div className="relative">
            <div 
              className="relative h-4 bg-card rounded-2xl border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <motion.div
                className="absolute top-0 left-0 h-full bg-primary rounded-xl"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between mt-6">
              {steps.map((step, index) => (
                <motion.button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={cn(
                    "flex flex-col items-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/20 rounded-2xl p-3",
                    index === activeStep ? "scale-110" : "scale-100 opacity-80 hover:opacity-100 hover:scale-105",
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`Go to step ${index + 1}: ${step.title}`}
                  aria-current={index === activeStep ? "step" : undefined}
                >
                  <motion.div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border-3 shadow-[4px_4px_0px_0px_hsl(var(--border))] transition-all duration-300",
                      index === activeStep
                        ? "bg-primary text-primary-foreground border-primary shadow-[4px_4px_0px_0px_hsl(var(--primary))]"
                        : index < activeStep
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-card text-muted-foreground border-border",
                    )}
                    animate={
                      index === activeStep
                        ? {
                            y: [0, -4, 0],
                          }
                        : {}
                    }
                    transition={{
                      repeat: index === activeStep ? Number.POSITIVE_INFINITY : 0,
                      repeatType: "reverse",
                      duration: 2,
                    }}
                  >
                    {index < activeStep ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </motion.div>
                  <span
                    className={cn(
                      "text-sm font-black text-center max-w-24",
                      index === activeStep ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <motion.div
          className="relative bg-card rounded-3xl p-6 md:p-8 border-3 border-border shadow-[8px_8px_0px_0px_hsl(var(--border))] overflow-hidden"
          style={{ minHeight: "480px" }}
          layout
        >
          {/* Step Content */}
          <motion.div
            key={`step-${activeStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: APPLE_EASING }}
            className="relative z-10 h-full"
          >
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start h-full">
              <div className="lg:w-1/2">
                <motion.div
                  className="inline-flex items-center justify-center p-5 rounded-2xl bg-primary text-primary-foreground text-2xl font-black mb-6 border-4 border-border shadow-[8px_8px_0px_0px_hsl(var(--border))]"
                  animate={{
                    y: [0, -4, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                >
                  {React.createElement(steps[activeStep].icon, { className: "h-8 w-8" })}
                </motion.div>
                <h3 className="text-3xl md:text-4xl font-black mb-4">{steps[activeStep].title}</h3>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">{steps[activeStep].description}</p>

                <div className="flex gap-4 flex-wrap">
                  <Button
                    variant="default"
                    className="rounded-xl bg-primary text-primary-foreground border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))] hover:translate-y-[-2px] transition-all duration-200 px-6 py-3 font-black text-base"
                    onClick={nextStep}
                  >
                    {activeStep === steps.length - 1 ? "Get Started" : "Next Step"}
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="rounded-xl border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))] hover:translate-y-[-2px] transition-all duration-200 px-6 py-3 font-black text-base"
                    onClick={prevStep}
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Previous
                  </Button>
                </div>
              </div>

              <div className="lg:w-1/2 w-full">
                <div className="bg-background rounded-2xl p-6 border-3 border-border shadow-[6px_6px_0px_0px_hsl(var(--border))]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-border"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-border"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-border"></div>
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-black border-2 border-primary/20">
                      Step {activeStep + 1} of {steps.length}
                    </div>
                  </div>

                  {getStepContent(activeStep)}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Mobile Navigation */}
        <div className="flex justify-between gap-4 mt-8 md:hidden">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            className="rounded-xl border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] flex-1 font-black py-3"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Previous
          </Button>
          <Button 
            variant="default" 
            onClick={nextStep} 
            className="rounded-xl bg-primary text-primary-foreground border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] flex-1 font-black py-3"
          >
            Next
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection