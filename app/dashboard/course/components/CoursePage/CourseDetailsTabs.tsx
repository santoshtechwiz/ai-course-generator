"use client"

import React, { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, FileText, ClipboardList } from "lucide-react"
import type { FullChapterType, FullCourseType } from "@/app/types/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import useSubscriptionStore from "@/store/useSubscriptionStore"

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
  const [isSummaryLoading, setIsSummaryLoading] = useState(true)
  const { subscriptionStatus } = useSubscriptionStore()
  const { theme } = useTheme()
  const isPremium =
    subscriptionStatus?.subscriptionPlan === "PRO" || subscriptionStatus?.subscriptionPlan === "ULTIMATE"

  const handleTabChange = (value: string) => {
    if (isPremium && (value === "summary" || !isSummaryLoading)) {
      setActiveTab(value as "summary" | "quiz")
    }
  }

  const handleSummaryReady = () => {
    setIsSummaryLoading(false)
  }

  const PremiumFeatureOverlay = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <Lock className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
      <p className="text-muted-foreground mb-4">Upgrade to Premium to access AI-powered summaries and quizzes.</p>
      <Button variant="default">Upgrade to Premium</Button>
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
                    disabled={!isPremium}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
                  >
                    <FileText className="w-4 h-4 mr-2 text-blue-500" />
                    Summary
                    {!isPremium && <Lock className="w-4 h-4 ml-2 inline-block text-yellow-500" />}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  {isPremium ? "View AI-generated summary" : "Upgrade to Premium to access AI-powered summaries"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="quiz"
                    disabled={!isPremium || isSummaryLoading}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
                  >
                    <ClipboardList className="w-4 h-4 mr-2 text-green-500" />
                    Quiz
                    {(!isPremium || isSummaryLoading) && <Lock className="w-4 h-4 ml-2 inline-block text-yellow-500" />}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  {!isPremium
                    ? "Upgrade to Premium to access quizzes"
                    : isSummaryLoading
                      ? "Please wait for the summary to load"
                      : "Take a quiz to test your knowledge"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsList>

          <div className="relative min-h-[300px]">
            {!isPremium ? (
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
                    <CourseAISummary chapterId={chapterId} name={name} onSummaryReady={handleSummaryReady} />
                  </React.Suspense>
                </TabsContent>
                <TabsContent value="quiz">
                  <React.Suspense
                    fallback={
                      <div className="h-[300px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    }
                  >
                    <CourseDetailsQuiz chapter={chapter} course={course} />
                  </React.Suspense>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default CourseDetailsTabs

