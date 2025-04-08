"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const VideoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-24 h-24 md:w-32 md:h-32 text-primary"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
)

const QuizIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-24 h-24 md:w-32 md:h-32 text-primary"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

interface CarouselItem {
  id: string
  name: string
  slug: string
  description: string
  tagline: string
  quizType?: "mcq" | "openended" | "fill-blanks" | "code"
  type: "course" | "quiz"
}

const buildLinks = (items: CarouselItem[]) => {
  return items.map((item) => {
    if (item.type === "course") {
      return `/dashboard/course/${item.slug}`
    }
    if (item.quizType === "mcq") {
      return `/dashboard/mcq/${item.slug}`
    }
    if (item.quizType === "openended") {
      return `/dashboard/openended/${item.slug}`
    }
    if (item.quizType === "fill-blanks") {
      return `/dashboard/blanks/${item.slug}`
    }
    return `/dashboard/code/${item.slug}`
  })
}

// Sample data for demonstration
const sampleItems: CarouselItem[] = [
  {
    id: "1",
    name: "Introduction to JavaScript",
    slug: "intro-javascript",
    description: "Learn the fundamentals of JavaScript programming with this comprehensive course.",
    tagline: "Master the basics of modern JavaScript",
    type: "course",
  },
  {
    id: "2",
    name: "React Fundamentals Quiz",
    slug: "react-fundamentals",
    description: "Test your knowledge of React with this interactive quiz covering core concepts.",
    tagline: "Challenge yourself with React questions",
    quizType: "mcq",
    type: "quiz",
  },
  {
    id: "3",
    name: "Python Programming",
    slug: "python-programming",
    description: "Explore Python programming from basics to advanced concepts with hands-on examples.",
    tagline: "Comprehensive Python learning path",
    type: "course",
  },
  {
    id: "4",
    name: "CSS Grid Challenge",
    slug: "css-grid-challenge",
    description: "Fill in the blanks to complete CSS Grid layouts and test your frontend skills.",
    tagline: "Perfect your layout skills",
    quizType: "fill-blanks",
    type: "quiz",
  },
  {
    id: "5",
    name: "Algorithms & Data Structures",
    slug: "algorithms-data-structures",
    description: "Practice coding algorithms and understand essential data structures.",
    tagline: "Boost your problem-solving skills",
    quizType: "code",
    type: "quiz",
  },
]

const ShowCaseCarousel = () => {
  const [items, setItems] = useState<CarouselItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const links = useMemo(() => buildLinks(items), [items])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // In a real app, this would be an API call
        // For demo purposes, we'll use the sample data after a short delay
        setTimeout(() => {
          setItems(sampleItems)
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error fetching carousel items:", error)
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [])

  const nextSlide = useCallback(() => {
    if (items.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
    }
  }, [items])

  const prevSlide = useCallback(() => {
    if (items.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length)
    }
  }, [items])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        nextSlide()
      } else if (event.key === "ArrowLeft") {
        prevSlide()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nextSlide, prevSlide])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-muted-foreground">Loading showcase items...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-lg">No showcase items available</div>
      </div>
    )
  }

  return (
    <section className="py-8 md:py-12" aria-label="Showcase Carousel">
      <div className="container px-4 md:px-6">
        <div className="relative max-w-3xl mx-auto">
          <motion.div
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 md:-left-12"
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous Slide"
              className="rounded-full bg-background/80 backdrop-blur-sm border border-border/10 shadow-md"
              onClick={prevSlide}
              disabled={items.length === 0}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 md:-right-12"
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next Slide"
              className="rounded-full bg-background/80 backdrop-blur-sm border border-border/10 shadow-md"
              onClick={nextSlide}
              disabled={items.length === 0}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </motion.div>

          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <Card className="w-full overflow-hidden rounded-2xl bg-card/30 backdrop-blur-sm border-border/30 shadow-md">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                      <motion.div
                        className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 10 }}
                      >
                        {items[currentIndex].type === "course" ? <VideoIcon /> : <QuizIcon />}
                      </motion.div>
                      <div className="flex flex-col gap-4 text-center md:text-left">
                        <div>
                          <h3 className="text-2xl md:text-3xl font-semibold text-primary mb-2">
                            {items[currentIndex].name}
                          </h3>
                          <p className="text-lg md:text-xl text-muted-foreground italic">
                            {items[currentIndex].tagline}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                          <Badge
                            variant={items[currentIndex].type === "course" ? "default" : "secondary"}
                            className="rounded-full px-3"
                          >
                            {items[currentIndex].type === "course" ? "Course" : "Quiz"}
                          </Badge>
                          {items[currentIndex].type !== "course" && (
                            <Badge variant="outline" className="rounded-full px-3">
                              {items[currentIndex].quizType === "mcq"
                                ? "Multiple Choice"
                                : items[currentIndex].quizType === "openended"
                                  ? "Open Ended"
                                  : items[currentIndex].quizType === "fill-blanks"
                                    ? "Fill in the Blank"
                                    : "Code"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm md:text-base text-muted-foreground">{items[currentIndex].description}</p>
                        <Link href={links[currentIndex]} className="mt-2">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            <Button variant="default" className="w-full md:w-auto rounded-full">
                              {items[currentIndex].type === "course" ? "Start Course" : "Take Quiz"}
                            </Button>
                          </motion.div>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center mt-4 space-x-2">
            {items.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? "bg-primary" : "bg-muted"
                }`}
                whileHover={{ scale: 1.5 }}
                whileTap={{ scale: 0.9 }}
                animate={index === currentIndex ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{
                  scale: {
                    duration: 1.5,
                    repeat: index === currentIndex ? Number.POSITIVE_INFINITY : 0,
                    repeatType: "reverse",
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ShowCaseCarousel
