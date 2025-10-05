"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, Lightbulb, BookOpen, Sparkles, Play, ArrowRight, Pause, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const TypeWriter = ({ text, setValue, delay = 50, onComplete }: {
  text: string
  setValue: (value: string | ((prev: string) => string)) => void
  delay?: number
  onComplete?: () => void
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    setValue("") // Reset the value when starting
    setCurrentIndex(0)
  }, [text, setValue])

  useEffect(() => {
    if (currentIndex < text.length) {
      const typingTimeout = setTimeout(() => {
        setValue((prev) => prev + text[currentIndex])
        setCurrentIndex((prevIndex) => prevIndex + 1)
      }, delay)

      return () => clearTimeout(typingTimeout)
    } else if (currentIndex === text.length && onComplete) {
      onComplete()
    }
  }, [currentIndex, text, delay, setValue, onComplete])

  return null
}

const CourseCreationVideo = () => {
  const [step, setStep] = useState(0)
  const [courseTitle, setCourseTitle] = useState("")
  const [courseDescription, setCourseDescription] = useState("")
  const [isPlaying, setIsPlaying] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [canSkipTyping, setCanSkipTyping] = useState(false)
  const [isTypingComplete, setIsTypingComplete] = useState(false)

  const steps = [
    { 
      title: "Course Info", 
      icon: <BookOpen className="w-5 h-5" />,
      description: "Define your course basics"
    },
    { 
      title: "AI Content", 
      icon: <Sparkles className="w-5 h-5" />,
      description: "AI generates your content"
    },
    { 
      title: "Ready to Launch", 
      icon: <Play className="w-5 h-5" />,
      description: "Your course is ready!"
    },
  ]

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Auto-progression logic
  useEffect(() => {
    if (!isPlaying) return

    const timer = setTimeout(() => {
      setStep((prevStep) => {
        const nextStep = (prevStep + 1) % steps.length
        if (nextStep === 0) {
          setIsTypingComplete(false)
        }
        return nextStep
      })
    }, step === 0 ? 8000 : 4000) // Longer time for first step due to typing

    return () => clearTimeout(timer)
  }, [step, isPlaying, steps.length])

  // Reset form when returning to step 0
  useEffect(() => {
    if (step === 0) {
      setCourseTitle("")
      setCourseDescription("")
      setCanSkipTyping(true)
      setIsTypingComplete(false)
    }
  }, [step])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSkipTyping = () => {
    if (step === 0 && canSkipTyping) {
      setCourseTitle("AI Generated Course Title")
      setCourseDescription("This is a comprehensive description of your AI-generated course.")
      setIsTypingComplete(true)
    }
  }

  const handleGetStarted = () => {
    // This would typically navigate to the actual course creation page
    console.log("Navigate to course creation")
    // Example: router.push('/create-course')
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: prefersReducedMotion ? 0 : (direction > 0 ? 300 : -300),
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: prefersReducedMotion ? 0 : (direction < 0 ? 300 : -300),
      opacity: 0,
    }),
  }

  const iconAnimationProps = prefersReducedMotion ? {} : {
    animate: {
      scale: [1, 1.2, 1],
      rotate: [0, 360, 0],
    },
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
    }
  }

  const playIconAnimationProps = prefersReducedMotion ? {} : {
    animate: {
      y: [0, -10, 0],
    },
    transition: {
      duration: 1,
      ease: "easeInOut",
      repeat: Infinity,
    }
  }

  return (
    <div className="w-full lg:w-96 space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="text-center">
          <CardTitle className="text-lg font-semibold">Create Your Course</CardTitle>
          <p className="text-sm text-muted-foreground">Watch how AI helps you build engaging courses</p>
        </CardHeader>
        <CardContent>
          {/* Progress and Controls */}
          <div className="flex items-center justify-between mb-4">
            <Progress value={(step + 1) * (100 / steps.length)} className="flex-1" />
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                className="h-8 w-8 p-0"
                aria-label={isPlaying ? "Pause demo" : "Play demo"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              {step === 0 && canSkipTyping && !isTypingComplete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipTyping}
                  className="h-8 w-8 p-0"
                  aria-label="Skip typing animation"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mb-8">
            {steps.map((s, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <motion.div
                  className={cn(
                    "rounded-full p-3 transition-colors duration-300",
                    step >= index 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "bg-muted text-muted-foreground"
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {s.icon}
                </motion.div>
                <span className="text-xs mt-2 text-center font-medium text-xs sm:text-sm">
                  {s.title}
                </span>
                <span className="text-xs text-muted-foreground text-center text-xs sm:text-sm">
                  {s.description}
                </span>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="relative min-h-[240px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute w-full"
              >
                {step === 0 && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="courseTitle" className="font-medium text-sm">
                        Course Title
                      </Label>
                      <Input
                        id="courseTitle"
                        placeholder="Enter your course title"
                        value={courseTitle}
                        readOnly
                        className="bg-muted/50"
                      />
                      {isPlaying && !isTypingComplete && (
                        <TypeWriter 
                          text="AI Generated Course Title" 
                          setValue={setCourseTitle} 
                          delay={75}
                          onComplete={() => setIsTypingComplete(true)}
                        />
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="courseDescription" className="font-medium text-sm">
                        Course Description
                      </Label>
                      <Textarea
                        id="courseDescription"
                        placeholder="Briefly describe your course"
                        value={courseDescription}
                        readOnly
                        className="bg-muted/50 min-h-[80px]"
                      />
                      {isPlaying && courseTitle && !courseDescription && (
                        <TypeWriter
                          text="This is a comprehensive description of your AI-generated course that will engage learners and provide valuable insights."
                          setValue={setCourseDescription}
                          delay={50}
                          onComplete={() => setIsTypingComplete(true)}
                        />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span className="font-medium">AI Assistant</span>
                      </div>
                      <p>Our AI analyzes your input and generates optimized course content automatically.</p>
                    </div>
                  </div>
                )}
                
                {step === 1 && (
                  <div className="text-center space-y-6">
                    <motion.div {...iconAnimationProps}>
                      <Sparkles className="w-16 h-16 mx-auto text-primary" />
                    </motion.div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">AI Content Generation</h3>
                      <p className="text-sm text-muted-foreground">
                        Our advanced AI is analyzing your course requirements and generating:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Interactive lesson plans</li>
                        <li>• Engaging quiz questions</li>
                        <li>• Multimedia content suggestions</li>
                      </ul>
                    </div>
                    <div className="flex justify-center">
                      <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-primary rounded-full"
                            animate={prefersReducedMotion ? {} : {
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {step === 2 && (
                  <div className="text-center space-y-6">
                    <motion.div {...playIconAnimationProps}>
                      <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-green-600" />
                      </div>
                    </motion.div>
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg text-green-600">Course Ready!</h3>
                      <p className="text-sm text-muted-foreground">
                        Your AI-generated course is complete with:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800">
                          <div className="font-medium text-green-700 dark:text-green-400">12 Lessons</div>
                          <div className="text-green-600 dark:text-green-500">Generated</div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800">
                          <div className="font-medium text-green-700 dark:text-green-400">24 Quizzes</div>
                          <div className="text-green-600 dark:text-green-500">Created</div>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={handleGetStarted}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                      size="lg"
                    >
                      Start Creating Your Course
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Course Creation Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {[
              {
                tip: "Keep your title concise and catchy",
                detail: "A good title should be under 60 characters and clearly convey the course value."
              },
              {
                tip: "Use AI to generate engaging content",
                detail: "Our AI analyzes successful courses to create content that keeps learners engaged."
              },
              {
                tip: "Include interactive quizzes for better learning",
                detail: "Interactive elements improve retention rates by up to 75%."
              },
            ].map((item, index) => (
              <motion.li
                key={index}
                className="flex items-start space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium">{item.tip}</span>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default CourseCreationVideo