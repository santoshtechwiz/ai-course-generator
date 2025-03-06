'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, FileText, HelpCircle, Sparkles, PlayCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HowItWorks() {
  const [topic, setTopic] = useState('')
  const [stage, setStage] = useState(0)
  const componentRef = useRef(null)
  const isInView = useInView(componentRef, { once: false, amount: 0.5 })
  const fullTopic = 'Master Web Development'

  useEffect(() => {
    if (isInView) {
      setTopic('')
      setStage(0)
    }
  }, [isInView])

  useEffect(() => {
    if (!isInView) return

    const typingInterval = setInterval(() => {
      if (topic.length < fullTopic.length) {
        setTopic(fullTopic.slice(0, topic.length + 1))
      } else {
        clearInterval(typingInterval)
        handleStart()
      }
    }, 100)

    return () => clearInterval(typingInterval)
  }, [topic, isInView])

  const handleStart = () => {
    const stageInterval = setInterval(() => {
      setStage((prevStage) => {
        if (prevStage < 4) {
          return prevStage + 1
        } else {
          clearInterval(stageInterval)
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

  return (
    <div className="py-4 px-4" ref={componentRef}>
      <Card className="mb-8 bg-card">
        <CardHeader>
          <CardTitle className="text-2xl">Create Your Learning Journey</CardTitle>
          <CardDescription>Watch AI transform your topic into a complete course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input 
              value={topic} 
              disabled={true}
              readOnly
              className="font-mono flex-grow"
            />
            <Button 
              disabled={stage > 0} 
              className={cn(
                "w-full sm:w-auto whitespace-nowrap",
                stage > 0 ? "bg-primary/50" : "bg-primary"
              )}
            >
              {stage > 0 ? <Loader2 className="mr-2 h-4 w-8 animate-spin" /> : null}
              {stage > 0 ? 'Processing...' : 'Start Learning'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {stage < 4 ? (
          <motion.div
            key="stages"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-4">
              {stages.map((s, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: stage > index ? 1 : 0.3,
                    y: 0
                  }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className={cn(
                    stage === index + 1 && "border-primary",
                    "bg-card/50 backdrop-blur-sm"
                  )}>
                    <CardContent className="flex items-center p-4">
                      <s.icon className="w-8 h-8 mr-4 text-primary" />
                      <span className="text-lg font-medium">{s.text}</span>
                      {stage === index + 1 && (
                        <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary" />
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
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-2xl">Your Web Development Course is Ready!</CardTitle>
                <CardDescription>
                  Start your learning journey with these curated lessons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {playlist.map((video, index) => (
                    <motion.li 
                      key={index} 
                      className="flex items-center p-3 rounded-lg border bg-card/50 backdrop-blur-sm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <PlayCircle className="mr-3 h-6 w-6 text-primary" />
                      <span className="font-medium">{video.title}</span>
                      <span className="ml-auto text-sm text-muted-foreground">{video.duration}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button className="w-full sm:w-auto" disabled={true}>
                  Begin Your Journey
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
