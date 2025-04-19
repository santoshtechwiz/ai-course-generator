"use client"

import React, { useState, Suspense, useTransition } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, ClipboardList, BookOpen, Loader2, Lock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

import type { FullChapterType, FullCourseType } from "@/app/types/types"

// Lazy load components for better performance
const CourseAISummary = React.lazy(() => import("./CourseAISummary"))
const CourseDetailsQuiz = React.lazy(() => import("./CourseDetailsQuiz"))

export interface CourseDetailsTabsProps {
  chapterId: number
  name: string
  course: FullCourseType
  chapter: FullChapterType
}

const TabSkeleton = () => (
  <div className="space-y-4 p-4">
    <div className="h-6 w-1/3 bg-muted rounded animate-pulse"></div>
    <div className="space-y-2">
      <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
      <div className="h-4 w-5/6 bg-muted rounded animate-pulse"></div>
      <div className="h-4 w-4/6 bg-muted rounded animate-pulse"></div>
    </div>
  </div>
)

const CourseDetailsTabs: React.FC<CourseDetailsTabsProps> = ({ chapterId, name, course, chapter }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "summary" | "quiz">("overview")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { data: session, status } = useSession()

  // Determine if user has premium access
  const isPremium =
    session?.user?.subscriptionPlan === "PRO" ||
    session?.user?.subscriptionPlan === "ULTIMATE" ||
    session?.user?.isAdmin === true

  const isPublicCourse = course.isPublic
  const isAuthenticated = status === "authenticated"
  const summaryAvailable = Boolean(chapter?.summary)
  const quizAvailable = chapter?.questions && chapter?.questions?.length > 0

  const handleTabChange = (value: string) => {
    startTransition(() => {
      setActiveTab(value as "overview" | "summary" | "quiz")
    })
  }

  const upgradetoPremium = () => {
    router.push("/dashboard/subscription")
  }

  // Render overview content
  const renderOverviewContent = () => {
    if (!chapter?.description) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No overview available</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            This chapter doesn't have an overview yet. Check back later for updates.
          </p>
        </div>
      )
    }

    return (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: chapter.description }} />
      </div>
    )
  }

  // Premium feature overlay component
  const PremiumFeatureOverlay = ({ feature }: { feature: "summary" | "quiz" }) => (
    <motion.div
      className="flex flex-col items-center justify-center p-6 text-center bg-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {feature === "summary"
          ? "AI-generated summaries help you quickly review key concepts from each chapter."
          : "Test your knowledge with interactive quizzes tailored to each chapter's content."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={upgradetoPremium} className="sm:flex-1">
          Upgrade to Premium
        </Button>
        {!isAuthenticated && (
          <Button variant="outline" onClick={() => signIn()} className="sm:flex-1">
            Sign In
          </Button>
        )}
      </div>
    </motion.div>
  )

  // Sign in overlay component
  const SignInOverlay = () => (
    <motion.div
      className="flex flex-col items-center justify-center p-6 text-center bg-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Please sign in to access course content and track your progress.
      </p>
      <Button onClick={() => signIn(undefined, { callbackUrl: window.location.href })}>Sign In</Button>
    </motion.div>
  )

  return (
    <div className="w-full">
      <Card className="border-border/50 shadow-sm bg-card">
        <CardContent className="p-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full rounded-none border-b bg-card p-0 h-auto">
              <TabsTrigger
                value="overview"
                className={cn(
                  "flex-1 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary",
                  "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                )}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Overview</span>
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="summary"
                className={cn(
                  "flex-1 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary",
                  "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  !isPremium && !isPublicCourse && "opacity-70",
                )}
                disabled={!isPremium && !isPublicCourse && !isAuthenticated}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>AI Summary</span>
                  {!isPremium && !isPublicCourse && <Lock className="h-3 w-3 ml-1" />}
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="quiz"
                className={cn(
                  "flex-1 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary",
                  "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  !isPremium && "opacity-70",
                )}
                disabled={!isPremium && !isAuthenticated}
              >
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  <span>Quiz</span>
                  {!isPremium && <Lock className="h-3 w-3 ml-1" />}
                  {quizAvailable && isPremium && (
                    <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4">
                      {chapter?.questions?.length || 0}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            </TabsList>

            <div className="relative min-h-[300px]">
              <AnimatePresence mode="wait">
                {status === "unauthenticated" ? (
                  <SignInOverlay />
                ) : (
                  <>
                    <TabsContent value="overview" className="mt-0 p-6 focus-visible:outline-none focus-visible:ring-0">
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {renderOverviewContent()}
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="summary" className="mt-0 p-6 focus-visible:outline-none focus-visible:ring-0">
                      {!isPremium && !isPublicCourse ? (
                        <PremiumFeatureOverlay feature="summary" />
                      ) : (
                        <Suspense
                          fallback={
                            <div className="p-4 flex flex-col space-y-4">
                              <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Loading summary...</p>
                              </div>
                              <TabSkeleton />
                            </div>
                          }
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CourseAISummary
                              chapterId={chapterId.toString()}
                              name={name}
                              existingSummary={chapter?.summary || null}
                              isPremium={isPremium}
                              isAdmin={session?.user?.isAdmin ?? false}
                            />
                          </motion.div>
                        </Suspense>
                      )}
                    </TabsContent>

                    <TabsContent value="quiz" className="mt-0 p-6 focus-visible:outline-none focus-visible:ring-0">
                      {!isPremium ? (
                        <PremiumFeatureOverlay feature="quiz" />
                      ) : (
                        <Suspense
                          fallback={
                            <div className="p-4 flex flex-col space-y-4">
                              <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Loading quiz...</p>
                              </div>
                              <TabSkeleton />
                            </div>
                          }
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CourseDetailsQuiz
                              isPremium={isPremium}
                              isPublicCourse={isPublicCourse}
                              chapter={chapter}
                              course={course}
                              chapterId={chapterId.toString()}
                            />
                          </motion.div>
                        </Suspense>
                      )}
                    </TabsContent>
                  </>
                )}
              </AnimatePresence>

              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default CourseDetailsTabs
