import { Suspense } from "react"
import Link from "next/link"
import { Metadata } from "next"
import { Compass, ArrowLeft, BookOpen, SearchX, Home, Sparkles, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRecommendedItems, RecommendedItem } from "@/app/utils/get-recommended-items"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { JsonLD } from "@/lib/seo/components"
import { Input } from "@/components/ui/input"


import { buildQuizUrl, QuizType } from "@/lib/utils"

// Export metadata for SEO optimization
export const metadata: Metadata = {
  title: "Page Not Found - CourseAI",
  description: "The page you're looking for doesn't exist. Discover amazing courses and quizzes to continue your learning journey.",
  robots: "noindex, nofollow"
}

// Container animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.7,
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  }
}

// Item animations
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    },
  }
}

// Recommended Item Card Component
function RecommendedItemCard({ item, index }: { item: RecommendedItem; index: number }) {
  return (
    <div
      className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
      style={{ transform: 'translateY(0)', transition: 'transform 0.3s ease' }}
     
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge
              variant={item.type === "course" ? "default" : "secondary"}
              className="text-xs"
            >
              {item.type === "course" ? "Course" : "Quiz"}
            </Badge>
            <Sparkles className="h-4 w-4 text-primary/60" />
          </div>
          <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="line-clamp-3 mb-4">
            {item.description}
          </CardDescription>
          <Button
            asChild
            size="sm"
            className="w-full"
            variant={item.type === "course" ? "default" : "outline"}
          >
            <Link href={item.type === "course" ? `/dashboard/course/${item.slug}` : buildQuizUrl(item.slug, item.quizType as QuizType)}>
              {item.type === "course" ? "Start Course" : "Take Quiz"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Fallback component for recommendations when loading or error occurs
function RecommendationsFallback() {
  return (
    <div className="w-full py-12 text-center">
      <div className="flex justify-center">
        <SearchX className="h-16 w-16 text-muted-foreground animate-pulse" />
      </div>
      <div className="mt-4 space-y-3">
        <div className="h-4 bg-muted rounded animate-pulse max-w-md mx-auto" />
        <div className="h-4 bg-muted rounded animate-pulse max-w-sm mx-auto" />
        <div className="h-4 bg-muted rounded animate-pulse max-w-lg mx-auto" />
      </div>
      <p className="mt-4 text-muted-foreground">
        Loading recommendations...
      </p>
    </div>
  )
}

// Recommendations component with server-side data fetching
async function Recommendations() {
  const recommendedItems = await getRecommendedItems(6)

  if (recommendedItems.length === 0) {
    return (
      <div className="w-full py-12 text-center">
        <div className="flex justify-center">
          <BookOpen className="h-16 w-16 text-muted-foreground" />
        </div>
        <p className="mt-4 text-muted-foreground">
          We couldn't load recommendations right now. Try exploring our courses directly.
        </p>
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
    >
      {recommendedItems.map((item, index) => (
        <RecommendedItemCard key={item.id} item={item} index={index} />
      ))}
    </div>
  )
}

// Structured data for SEO
const notFoundStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Page Not Found - CourseAI",
  "description": "The page you're looking for doesn't exist. Discover amazing courses and quizzes to continue your learning journey.",
  "url": "https://courseai.com/404",
  "mainEntity": {
    "@type": "ItemList",
    "name": "Recommended Learning Content",
    "description": "Popular courses and quizzes you might be interested in"
  }
}

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Add structured data for SEO */}
      <JsonLD type="WebPage" data={notFoundStructuredData} />

      <main className="flex-grow flex items-center justify-center px-4 py-12 md:py-16">
        <div
          className="max-w-6xl w-full space-y-12 md:space-y-16"
        >
          {/* 404 Header Section */}
          <div className="text-center">
            <div
              className="relative inline-block"
            >
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl opacity-30" />
              <h1 className="text-7xl md:text-8xl font-bold text-primary relative z-10">404</h1>
            </div>

            <h2
              className="text-3xl md:text-4xl font-bold text-foreground mt-4"
            >
              Page Not Found
            </h2>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
              Looks like you've ventured into uncharted territory! Don't worry,
              we've gathered some excellent learning opportunities below to get you back on track.
            </p>
          </div>

          {/* Search Section */}
          <div
            className="w-full max-w-md mx-auto"
          >
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Search for Content
              </h3>
              <p className="text-muted-foreground text-sm">
                Can't find what you're looking for? Try searching our library.
              </p>
            </div>
            <form action="/dashboard/explore" method="GET" className="flex gap-2">
              <Input
                type="text"
                name="q"
                placeholder="Search courses, quizzes..."
                className="flex-1"
                required
              />
              <Button type="submit" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Recommendations Section */}
          <div
            className="w-full"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Recommended for You
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover our most popular courses and quizzes to continue your learning journey
              </p>
            </div>

            <Suspense fallback={<RecommendationsFallback />}>
              <Recommendations />
            </Suspense>
          </div>

          {/* Navigation Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
          >
            <Button
              size="lg"
              variant="default"
              className="h-12 px-8 text-base font-medium w-full sm:w-auto"
              asChild
            >
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-5 w-5" /> Go to Dashboard
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base font-medium w-full sm:w-auto"
              asChild
            >
              <Link href="/dashboard/explore">
                <Compass className="mr-2 h-5 w-5" /> Explore More
              </Link>
            </Button>

            <Button
              size="lg"
              variant="secondary"
              className="h-12 px-8 text-base font-medium w-full sm:w-auto"
              asChild
            >
              <Link href="/">
                <Home className="mr-2 h-5 w-5" /> Go Home
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
