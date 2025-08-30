import { Suspense } from "react"
import Link from "next/link"
import { Metadata } from "next"
import { Compass, ArrowLeft, BookOpen, SearchX, Home, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRecommendedItems, RecommendedItem } from "@/app/utils/get-recommended-items"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { JsonLD } from "@/lib/seo"

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
      when: "beforeChildren",
      staggerChildren: 0.2,
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
    <motion.div
      variants={itemVariants}
      custom={index}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
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
            <Link href={item.type === "course" ? `/dashboard/course/${item.slug}` : `/dashboard/${item.type}/${item.slug}`}>
              {item.type === "course" ? "Start Course" : "Take Quiz"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Fallback component for recommendations when loading or error occurs
function RecommendationsFallback() {
  return (
    <div className="w-full py-12 text-center">
      <div className="flex justify-center">
        <SearchX className="h-16 w-16 text-muted-foreground animate-pulse" />
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
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {recommendedItems.map((item, index) => (
        <RecommendedItemCard key={item.id} item={item} index={index} />
      ))}
    </motion.div>
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
        <motion.div
          className="max-w-6xl w-full space-y-12 md:space-y-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* 404 Header Section */}
          <div className="text-center">
            <motion.div
              variants={itemVariants}
              className="relative inline-block"
            >
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl opacity-30" />
              <h1 className="text-7xl md:text-8xl font-bold text-primary relative z-10">404</h1>
            </motion.div>

            <motion.h2
              className="text-3xl md:text-4xl font-bold text-foreground mt-4"
              variants={itemVariants}
            >
              Page Not Found
            </motion.h2>

            <motion.p
              className="text-xl text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed"
              variants={itemVariants}
            >
              Looks like you've ventured into uncharted territory! Don't worry,
              we've gathered some excellent learning opportunities below to get you back on track.
            </motion.p>
          </div>

          {/* Recommendations Section */}
          <motion.div
            variants={itemVariants}
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
          </motion.div>

          {/* Navigation Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
            variants={itemVariants}
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
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
