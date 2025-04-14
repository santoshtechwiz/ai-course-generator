import type { Metadata } from "next"
import { QuizCourseWrapper } from "@/components/QuizCourseWrapper"
import RandomQuote from "@/components/RandomQuote"
import { BookOpen, Lightbulb } from "lucide-react"
import { getCourseDetails } from "@/app/actions/getCourseDetails"
import { Card } from "@/components/ui/card"
import type { QueryParams } from "@/app/types/types"
import PopularCourses from "@/app/dashboard/course/components/PopularCourses"

// Add this line to explicitly mark the page as dynamic
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Create Free Video  Course Using AI ",
  description:
    "Design and build your own interactive course with our intuitive course creation tools. Share your expertise and engage learners effectively.",
  keywords: [
    "course creation",
    "build online course",
    "teaching platform",
    "educational content",
    "course design",
    "AI course builder",
  ],
  openGraph: {
    title: "Create Your Course ",
    description: "Design and build your own interactive course with our intuitive course creation tools.",
    url: "https://courseai.io/dashboard/explore",
    type: "website",
    images: [{ url: "/og-image-create-course.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Your Course ",
    description: "Design and build your own interactive course with our intuitive course creation tools.",
    images: ["/twitter-image-create-course.jpg"],
  },
}

const Page = async ({
  params,
  searchParams: searchParamsPromise,
}: {
  params: QueryParams
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  let title = ""
  let category = ""
  let courseData = []

  try {
    const searchParams = await searchParamsPromise

    title =
      typeof params?.title === "string"
        ? params.title
        : Array.isArray(params?.title)
        ? params.title[0]
        : ""

    category =
      typeof params?.categoryAttachment === "string"
        ? params.categoryAttachment
        : Array.isArray(searchParams?.category)
        ? searchParams.category[0]
        : searchParams?.category || ""

    courseData = await getCourseDetails()
  } catch (error) {
    console.warn("Failed to fetch course details:", error)
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  // CreativeWork schema
  const creativeWorkSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Course Creation Tool",
    description: "Design and build your own interactive course with our intuitive course creation tools.",
    creator: {
      "@type": "Organization",
      name: "Course AI",
    },
    url: `${baseUrl}/dashboard/explore`,
  }

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
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
    <div className="container mx-auto py-6 space-y-6 min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {/* RandomQuote Section */}
      <RandomQuote />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section - Create Your Course */}
        <div className="lg:col-span-2">
          <Card className="relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
            <div className="relative bg-background/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-border/50">
              <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center text-foreground">
                  <BookOpen className="mr-2 h-6 w-6 text-primary" />
                  Create Your Course
                </h2>
                <div className="hidden sm:flex items-center text-sm text-muted-foreground bg-secondary/10 px-3 py-1.5 rounded-full">
                  <Lightbulb className="h-4 w-4 mr-1.5 text-yellow-500" />
                  Pro tip: Be specific with your topic
                </div>
              </div>
              <QuizCourseWrapper
                type="course"
                queryParams={{
                  title: title,
                  category: category,
                }}
              />
            </div>
          </Card>
        </div>

        {/* Right Section - Explore Courses */}
        <div className="lg:col-span-1">
          <Card className="relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
            <div className="relative bg-background/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-border/50">
              <PopularCourses courseDetails={courseData} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Page
