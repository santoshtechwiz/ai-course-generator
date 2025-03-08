"use client"

import React, { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, FileText, ClipboardList } from "lucide-react"
import type { FullChapter, FullChapterType, FullCourseType } from "@/app/types/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

import useSubscriptionStore from "@/store/useSubscriptionStore"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"

const CourseAISummary = React.lazy(() => import("./CourseAISummary"))
const CourseDetailsQuiz = React.lazy(() => import("./CourseDetailsQuiz"))

export interface CourseDetailsTabsProps {
  chapterId: number
  name: string
  course: FullCourseType
  chapter: FullChapterType
}

const CourseDetailsTabs: React.FC<CourseDetailsTabsProps> = ({ chapterId, name, course, chapter }) => {
  const [activeTab, setActiveTab] = useState<"summary" | "quiz">("summary")
  const { subscriptionStatus } = useSubscriptionStore()
  const router = useRouter()
  const { data: session, status } = useSession()

  const isPremium =
    subscriptionStatus?.subscriptionPlan === "PRO" || subscriptionStatus?.subscriptionPlan === "ULTIMATE"

  const isPublicCourse = course.isPublic
  const summaryAvailable = Boolean(chapter?.summary)
  const quizAvailable = chapter?.questions && chapter?.questions?.length > 0

  const handleTabChange = (value: string) => {
    if ((isPremium || isPublicCourse) && value === "summary") {
      setActiveTab("summary")
    } else if (isPremium && value === "quiz") {
      setActiveTab("quiz")
    }
  }

  const upgradetoPremium = () => {
    router.push("/dashboard/subscription")
  }



  const PremiumFeatureOverlay = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <Lock className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
      <p className="text-muted-foreground mb-4">Upgrade to Premium to access AI-powered summaries and quizzes.</p>
      <Button onClick={upgradetoPremium} variant="default">
        Upgrade to Premium
      </Button>
    </div>
  )

  const SignInOverlay = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <Lock className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
      <p className="text-muted-foreground mb-4">Please sign in to access course content.</p>
      <Button onClick={() => signIn(undefined, { callbackUrl: window.location.href })} variant="default">
        Sign In
      </Button>
    </div>
  )

  return (
    <Card className="w-full">
      <CardContent className="p-2">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="summary"
                    disabled={!isPremium && !isPublicCourse}
                    className={`data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative ${
                      activeTab === "summary" ? "border-b-2 border-primary" : ""
                    }`}
                  >
                    <FileText className="w-4 h-4 mr-2 text-blue-500" />
                    Summary
                    {!isPremium && !isPublicCourse && <Lock className="w-4 h-4 ml-2 inline-block text-yellow-500" />}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  {isPremium || isPublicCourse ? "View chapter summary" : "Upgrade to Premium to access summaries"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="quiz"
                    disabled={!isPremium}
                    className={`data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative ${
                      activeTab === "quiz" ? "border-b-2 border-primary" : ""
                    }`}
                  >
                    <ClipboardList className="w-4 h-4 mr-2 text-green-500" />
                    Quiz
                    {!isPremium && <Lock className="w-4 h-4 ml-2 inline-block text-yellow-500" />}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  {!isPremium ? "Upgrade to Premium to access quizzes" : "Take a quiz to test your knowledge"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsList>

          <div className="relative min-h-[300px]">
            {status === "unauthenticated" ? (
              <SignInOverlay />
            ) : !isPremium && !isPublicCourse ? (
              <PremiumFeatureOverlay />
            ) : (
              <>
                <TabsContent value="summary">
                  <React.Suspense
                    fallback={
                      <div className="h-[300px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    }
                  >
                    <CourseAISummary
                      chapterId={chapterId}
                      name={name}
                      existingSummary={chapter?.summary}
                      isPremium={isPremium}
                      isAdmin={session?.user?.isAdmin ?? false}
                    />
                  </React.Suspense>
                </TabsContent>
                {isPremium && (
                  <TabsContent value="quiz">
                    <React.Suspense
                      fallback={
                        <div className="h-[300px] flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      }
                    >
                      <CourseDetailsQuiz 
                        isPremium={isPremium}
                        isPublicCourse={isPublicCourse}
                      chapter={chapter} course={course} />
                    </React.Suspense>
                  </TabsContent>
                )}
              </>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default CourseDetailsTabs

