"use client"

import React, { useState, useEffect } from "react"
import {  AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import dynamic from "next/dynamic"
import ConfettiExplosion from "react-confetti-explosion"
export interface CourseDetailsTabsProps {
  chapterId: number
  name: string
  course: Course
  chapter: Chapter
}
export function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="w-8 h-8 text-primary" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-muted-foreground"
      >
        Loading content...
      </motion.p>
    </div>
  )
}
import { motion } from "framer-motion"
import { Chapter, Course } from "@/app/types"

export function ProgressBar() {
  return (
    <div className="w-full h-1 bg-secondary/30 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-primary"
        initial={{ x: "-100%" }}
        animate={{ x: "0%" }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  )
}




const CourseAISummary = dynamic(() => import("./CourseAISummary"), {
  loading: () => <LoadingFallback />,
})

const CourseDetailsQuiz = dynamic(() => import("./CourseDetailsQuiz"), {
  loading: () => <LoadingFallback />,
})

type Tab = "summary" | "quiz"

const tabVariants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

const CourseDetailsTabs: React.FC<CourseDetailsTabsProps> = ({
  chapterId,
  name,
  course,
  chapter,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("summary")
  const [isSummaryReady, setIsSummaryReady] = useState(false)
  const [isExploding, setIsExploding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSummaryReady = (isReady: boolean) => {
    setIsSummaryReady(isReady)
    if (isReady) {
      setIsExploding(true)
      setTimeout(() => setIsExploding(false), 3000)
    }
  }

  useEffect(() => {
    setIsSummaryReady(false)
    setActiveTab("summary")
    setError(null)
  }, [chapterId])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as Tab)}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger
              value="summary"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
            >
              <span className="flex items-center gap-2">
                Summary
                {activeTab === "summary" && !isSummaryReady && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -bottom-4 left-0 right-0"
                  >
                    <ProgressBar />
                  </motion.span>
                )}
                {isSummaryReady && activeTab === "summary" && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </motion.span>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="quiz"
              disabled={!isSummaryReady}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                Quiz
                {!isSummaryReady && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Loader2 className="w-4 h-4" />
                  </motion.span>
                )}
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="relative min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={tabVariants}
                initial="initial"
                animate="enter"
                exit="exit"
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  duration: 0.5,
                }}
              >
                <TabsContent value="summary" className="mt-0">
                  <CourseAISummary
                    chapterId={chapterId}
                    name={name}
                    onSummaryReady={handleSummaryReady}
                    onError={(msg) => setError(msg)}
                  />
                </TabsContent>
                <TabsContent value="quiz" className="mt-0">
                  <CourseDetailsQuiz
                    chapter={chapter}
                    course={course}
                    onError={(msg) => setError(msg)}
                  />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>

        {isExploding && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
            <ConfettiExplosion
              force={0.8}
              duration={3000}
              particleCount={100}
              width={1600}
              colors={[
                "#22C55E", // green
                "#3B82F6", // blue
                "#EC4899", // pink
                "#EAB308", // yellow
              ]}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CourseDetailsTabs

