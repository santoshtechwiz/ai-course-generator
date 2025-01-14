'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Lightbulb, BookOpen, Sparkles, Play } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

const TypeWriter = ({ text, setValue, delay = 50 }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setValue((prev) => prev + text[currentIndex])
        setCurrentIndex((prevIndex) => prevIndex + 1)
      } else {
        clearInterval(typingInterval)
      }
    }, delay)

    return () => clearInterval(typingInterval)
  }, [currentIndex, text, delay, setValue])

  return null
}

const CourseCreationVideo = () => {
  const [step, setStep] = useState(0)
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDescription, setCourseDescription] = useState('')
  const [triggerTypeEffect, setTriggerTypeEffect] = useState(false)

  const steps = [
    { title: "Course Info", icon: <BookOpen className="w-5 h-5" /> },
    { title: "AI Content", icon: <Sparkles className="w-5 h-5" /> },
    { title: "Finalize", icon: <Play className="w-5 h-5" /> },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prevStep) => (prevStep + 1) % steps.length)
      setTriggerTypeEffect(true)
    }, 5000)

    return () => clearInterval(timer)
  }, [steps.length])

  useEffect(() => {
    if (step === 0) {
      setCourseTitle('')
      setCourseDescription('')
      setTriggerTypeEffect(true)
    }
  }, [step])

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  return (
    <aside className="w-full lg:w-96 p-4 space-y-4 bg-background border-l h-[calc(100vh-4rem)] overflow-y-auto">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-center">Create Your Course</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={(step + 1) * (100 / steps.length)} className="mb-4" />
          <div className="flex justify-between mb-6">
            {steps.map((s, index) => (
              <div key={index} className="flex flex-col items-center">
                <motion.div
                  className={`rounded-full p-2 ${step >= index ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                >
                  {s.icon}
                </motion.div>
                <span className="text-xs mt-1 text-center hidden sm:inline-block">{s.title}</span>
              </div>
            ))}
          </div>

          <div className="relative min-h-[200px]">
            <AnimatePresence initial={false} custom={step}>
              <motion.div
                key={step}
                custom={step}
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
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="courseTitle">Course Title</Label>
                      <Input
                        id="courseTitle"
                        placeholder="Enter your course title"
                        value={courseTitle} 
                        readOnly
                        onChange={(e) => setCourseTitle(e.target.value)}
                      />
                      {triggerTypeEffect && (
                        <TypeWriter
                          text="AI Generated Course Title"
                          setValue={setCourseTitle}
                          delay={75}
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseDescription">Course Description</Label>
                      <Textarea
                        id="courseDescription"
                        placeholder="Briefly describe your course"
                        value={courseDescription}
                        readOnly
                        onChange={(e) => setCourseDescription(e.target.value)}
                      />
                      {triggerTypeEffect && (
                        <TypeWriter
                          text="This is a comprehensive description of your AI-generated course."
                          setValue={setCourseDescription}
                          delay={50}
                        />
                      )}
                    </div>
                  </div>
                )}
                {step === 1 && (
                  <div className="text-center space-y-4">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360, 0],
                      }}
                      transition={{
                        duration: 2,
                        ease: "easeInOut",
                        repeat: Infinity,
                      }}
                    >
                      <Sparkles className="w-16 h-16 mx-auto text-primary" />
                    </motion.div>
                    <p>Our AI is generating engaging content for your course...</p>
                  </div>
                )}
                {step === 2 && (
                  <div className="text-center space-y-4">
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 1,
                        ease: "easeInOut",
                        repeat: Infinity,
                      }}
                    >
                      <Play className="w-16 h-16 mx-auto text-primary" />
                    </motion.div>
                    <p>Your course is ready! Click 'Finish' to publish.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <Button
            onClick={() => {}}
            className="w-full mt-6"
            disabled={step !== steps.length - 1}
          >
            {step === steps.length - 1 ? "Finish" : "Next"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Creation Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {["Keep your title concise and catchy", "Use AI to generate engaging content", "Include interactive quizzes for better learning"].map((tip, index) => (
              <motion.li
                key={index}
                className="flex items-center space-x-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <Lightbulb className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">{tip}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </aside>
  )
}

export default CourseCreationVideo

