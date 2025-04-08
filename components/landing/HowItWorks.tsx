"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, FileText, HelpCircle, Sparkles, PlayCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function HowItWorks() {
  const [topic, setTopic] = useState("")
  const [stage, setStage] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const componentRef = useRef(null)
  const isInView = useInView(componentRef, { once: false, amount: 0.5 })
  const fullTopic = "Master Web Development"

  useEffect(() => {
    if (isInView) {
      setTopic("")
      setStage(0)
      setIsAutoPlaying(true)
    } else {
      setIsAutoPlaying(false)
    }
  }, [isInView])

  useEffect(() => {
    if (!isInView || !isAutoPlaying) return

    const typingInterval = setInterval(() => {
      if (topic.length < fullTopic.length) {
        setTopic(fullTopic.slice(0, topic.length + 1))
      } else {
        clearInterval(typingInterval)
        handleStart()
      }
    }, 100)

    return () => clearInterval(typingInterval)
  }, [topic, isInView, isAutoPlaying])

  const handleStart = () => {
    if (!isAutoPlaying) return

    const stageInterval = setInterval(() => {
      setStage((prevStage) => {
        if (prevStage < 4) {
          return prevStage + 1
        } else {
          clearInterval(stageInterval)
          // Reset after a delay for continuous demo
          setTimeout(() => {
            if (isInView && isAutoPlaying) {
              setTopic("")
              setStage(0)
            }
          }, 5000)
          return prevStage
        }
      })
    }, 2000)

    return () => clearInterval(stageInterval)
  }

  const stages = [
    { icon: Brain, text: "AI analyzes your learning goals" },
    { icon: Sparkles, text: "Generates personalized content" },
    { icon: FileText, text: "Creates comprehensive materials" },
    { icon: HelpCircle, text: "Develops interactive quizzes" },
  ]

  const playlist = [
    { title: "Introduction to Web Development", duration: "10:15" },
    { title: "HTML & CSS Fundamentals", duration: "15:30" },
    { title: "JavaScript Basics", duration: "12:45" },
    { title: "Responsive Design", duration: "08:20" },
    { title: "Modern Web Development Tools", duration: "14:50" },
  ]

  const handleManualControl = () => {
    setIsAutoPlaying(false)
    if (stage < 4) {
      setStage(stage + 1)
    } else {
      setTopic("")
      setStage(0)
    }
  }

  return (
    <div className="py-4 px-4" ref={componentRef}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        viewport={{ once: true }}
      >
        <Card className="mb-8 bg-card/30 backdrop-blur-sm hover:shadow-lg transition-all duration-300 rounded-2xl border-border/30">
          <CardHeader>
            <CardTitle className="text-2xl">Create Your Learning Journey</CardTitle>
            <CardDescription>Watch AI transform your topic into a complete course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <Input
                  value={topic}
                  disabled={true}
                  readOnly
                  className="font-mono flex-grow pr-10 rounded-full h-12 bg-background/50 backdrop-blur-sm border-border/30"
                />
                <motion.span
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-primary"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ display: topic.length < fullTopic.length ? "block" : "none" }}
                />
              </div>
              <Button
                onClick={handleManualControl}
                className={cn(
                  "w-full sm:w-auto whitespace-nowrap transition-all duration-300 rounded-full h-12",
                  stage > 0 ? "bg-primary/80" : "bg-primary",
                )}
              >
                {stage > 0 && stage < 4 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : stage === 4 ? (
                  "Restart Demo"
                ) : (
                  "Start Learning"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        {stage < 4 ? (
          <motion.div
            key="stages"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="space-y-4">
              {stages.map((s, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{
                    opacity: stage > index ? 1 : 0.3,
                    y: 0,
                    scale: 1,
                    x: stage === index + 1 ? [0, 5, 0] : 0,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    x: { repeat: stage === index + 1 ? Number.POSITIVE_INFINITY : 0, duration: 0.5 },
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  <Card
                    className={cn(
                      "bg-card/30 backdrop-blur-sm transition-all duration-300 rounded-2xl border-border/30",
                      stage === index + 1 && "border-primary/30 shadow-md",
                    )}
                  >
                    <CardContent className="flex items-center p-4">
                      <motion.div
                        animate={
                          stage === index + 1
                            ? {
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, -10, 0],
                              }
                            : {}
                        }
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: [0.25, 0.1, 0.25, 1] }}
                      >
                        <s.icon className="w-8 h-8 mr-4 text-primary" />
                      </motion.div>
                      <span className="text-lg font-medium">{s.text}</span>
                      {stage === index + 1 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="ml-auto"
                        >
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="playlist"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Card className="bg-card/30 backdrop-blur-sm hover:shadow-lg transition-all duration-300 rounded-2xl border-border/30">
              <CardHeader>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <CardTitle className="text-2xl">Your Web Development Course is Ready!</CardTitle>
                  <CardDescription>Start your learning journey with these curated lessons</CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {playlist.map((video, index) => (
                    <motion.li
                      key={index}
                      className="flex items-center p-3 rounded-xl border border-border/30 bg-card/20 backdrop-blur-sm hover:bg-card/40 transition-all duration-200 cursor-pointer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      transition={{
                        delay: index * 0.1,
                        scale: { duration: 0.2 },
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <PlayCircle className="mr-3 h-6 w-6 text-primary" />
                      </motion.div>
                      <span className="font-medium">{video.title}</span>
                      <span className="ml-auto text-sm text-muted-foreground">{video.duration}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button className="w-full sm:w-auto relative overflow-hidden group rounded-full">
                    <motion.span
                      className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 group-hover:w-full"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                    />
                    Begin Your Journey
                  </Button>
                </motion.div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
