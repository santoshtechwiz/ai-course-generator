import RandomQuote from "@/components/RandomQuote"
import { BookOpen, Lightbulb, TrendingUp, ArrowRight, Sparkles, Target, Users, Clock } from "lucide-react"
import { getCourseDetails } from "@/app/actions/getCourseDetails"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { QueryParams } from "@/app/types/types"
import PopularCourses from "@/app/dashboard/course/components/PopularCourses"
import QuizCourseWrapper from "../(quiz)/components/QuizCourseWrapper"

import NavigationDebugger from "@/components/debug/NavigationDebugger"
import { JsonLD } from "@/lib/seo"
import { generateMetadata } from "@/lib/seo"

export const dynamic = "force-dynamic"

// Removed force-dynamic to allow static optimization / caching where possible

export const metadata = generateMetadata({
  title: "Create Free Video Course Using AI",
  description:
    "Design and build your own interactive course with our intuitive course creation tools. Share your expertise and engage learners effectively.",
  keywords: [
    "course creation",
    "build online course",
    "teaching platform",
    "educational content",
    "course design",
    "AI course builder",
    "video course creator",
  ],
  type: "website",
  image: "/og-image-create-course.jpg",
})

const Page = async ({
  params,
  searchParams: searchParamsPromise,
}: {
  params: QueryParams
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  let title = ""
  let category = ""
  let difficulty = ""
  let courseData = []

  try {
    const searchParams = await searchParamsPromise

    title = Array.isArray(params?.title) ? params.title[0] : params?.title || ""

    category =
      typeof params?.categoryAttachment === "string"
        ? params.categoryAttachment
        : Array.isArray(searchParams?.category)
          ? searchParams.category[0]
          : searchParams?.category || ""

    difficulty = Array.isArray(searchParams?.difficulty)
      ? searchParams.difficulty[0]
      : typeof searchParams?.difficulty === "string"
        ? searchParams.difficulty
        : ""

    courseData = await getCourseDetails()
    console.log("Fetched course data:", courseData)
  } catch (error) {
    console.warn("Failed to fetch course details:", error)
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  const creativeWorkSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Course Creation Tool",
    description: "Design and build your own interactive course with our intuitive course creation tools.",
    creator: { "@type": "Organization", name: "Course AI" },
    url: `${baseUrl}/dashboard/explore`,
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Dashboard",
        item: `${baseUrl}/dashboard`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Create Course",
        item: `${baseUrl}/dashboard/explore`,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
  <div className="w-full px-0 py-6 space-y-6">
        {process.env.NODE_ENV === "development" && <NavigationDebugger />}
        <JsonLD type="CreativeWork" data={creativeWorkSchema} />
        <JsonLD type="BreadcrumbList" data={breadcrumbSchema} />

        {/* Compact Random Quote */}
        <RandomQuote />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Left Section - Course Creation Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="relative overflow-hidden border-4 border-border shadow-neo bg-card">
              {/* Clean Nerobrutal design - no decorative gradients */}

              <CardHeader className="relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                        <BookOpen className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground">Create Your Course</CardTitle>
                        <p className="text-sm text-muted-foreground">Transform your knowledge into engaging content</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" className="bg-accent/10 text-accent border-accent/20">
                      <Sparkles className="h-3 w-3 mr-1 text-accent" />
                      AI Powered
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
                      <Lightbulb className="h-3 w-3 mr-1.5 text-accent" />
                      Be specific with your topic
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative">
                {/* Enhanced form wrapper with visual feedback */}
                <div className="relative">
                  {/* Form background with subtle pattern */}
                  <div className="absolute inset-0 bg-card rounded-lg pointer-events-none" />

                  {/* Form container with enhanced styling */}
                  <div className="relative bg-background/50 backdrop-blur-sm border border-border/50 rounded-lg p-6 shadow-sm">
                    <QuizCourseWrapper
                      type="course"
                      queryParams={{
                        title,
                        category,
                        difficulty: difficulty as any,
                      }}
                    />
                  </div>
                </div>

                {/* Feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/30">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                    <div className="p-2 rounded-full bg-accent/10">
                      <Target className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Smart Structure</p>
                      <p className="text-xs text-muted-foreground">AI-generated course outline</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 dark:bg-accent/5 border border-accent/20 dark:border-accent/20">
                    <div className="p-2 rounded-full bg-accent/20 dark:bg-accent/10">
                      <Clock className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Quick Setup</p>
                      <p className="text-xs text-muted-foreground">Ready in minutes</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 dark:bg-accent/5 border border-accent/20 dark:border-accent/20">
                    <div className="p-2 rounded-full bg-accent/20 dark:bg-accent/10">
                      <Users className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Engage Learners</p>
                      <p className="text-xs text-muted-foreground">Interactive content</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Right Section - Popular Courses */}
          <div className="space-y-6">
            <Card className="relative overflow-hidden border-4 border-border shadow-neo bg-card">
              {/* Clean Nerobrutal design */}

              <CardHeader className="relative pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                      <TrendingUp className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">Popular Courses</CardTitle>
                      <p className="text-xs text-muted-foreground">Trending in the community</p>
                    </div>
                  </div>
                  <Badge variant="neutral" className="text-xs">
                    Live
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <PopularCourses courseDetails={courseData} />

                {/* Enhanced CTA Section */}
                <div className="border-t border-border/30 pt-4 mt-6">
                  <div className="relative overflow-hidden rounded-lg bg-accent/10 border-4 border-accent p-4">
                    {/* Clean design */}

                    <div className="relative flex items-start gap-3">
                      <div className="p-2 rounded-full bg-accent/20 border border-accent/30">
                        <BookOpen className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-foreground mb-1">Ready to share your knowledge?</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          Join thousands of creators building amazing courses
                        </p>
                        <Button className="w-full group" asChild>
                          <Link href="/dashboard/explore">
                            <Sparkles className="mr-2 h-3 w-3" />
                            <span>Browse More Courses</span>
                            <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page
