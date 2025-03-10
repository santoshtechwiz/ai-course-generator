"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
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

// Mock data for demonstration
const mockItems = [
  {
    id: "1",
    name: "Web Development Fundamentals",
    slug: "web-dev-fundamentals",
    description: "Learn the core concepts of modern web development with this comprehensive course.",
    tagline: "From beginner to developer in 4 weeks",
    type: "course",
  },
  {
    id: "2",
    name: "JavaScript Essentials",
    slug: "javascript-essentials",
    description: "Test your JavaScript knowledge with this interactive quiz covering all the fundamentals.",
    tagline: "Verify your JS skills",
    quizType: "mcq",
    type: "quiz",
  },
  {
    id: "3",
    name: "React Framework Deep Dive",
    slug: "react-deep-dive",
    description: "Explore advanced React concepts and patterns with practical examples.",
    tagline: "Master component architecture",
    type: "course",
  },
  {
    id: "4",
    name: "CSS Layout Challenge",
    slug: "css-layout-challenge",
    description: "Test your CSS layout skills with this challenging quiz on Flexbox and Grid.",
    tagline: "Prove your layout mastery",
    quizType: "openended",
    type: "quiz",
  },
  {
    id: "5",
    name: "Full-Stack Development",
    slug: "full-stack-dev",
    description: "Learn both frontend and backend development in this comprehensive course.",
    tagline: "Become a versatile developer",
    type: "course",
  },
]

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
      return `/quiz/mcq/${item.slug}`
    }
    if (item.quizType === "openended") {
      return `/quiz/openended/${item.slug}`
    }
    if (item.quizType === "fill-blanks") {
      return `/quiz/blanks/${item.slug}`
    }
    return `/quiz/code/${item.slug}`
  })
}

const ShowCaseCarousel = () => {
  const [items, setItems] = useState<CarouselItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [autoplay, setAutoplay] = useState(true)
  const carouselRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(carouselRef, { once: false, amount: 0.3 })

  const links = useMemo(() => buildLinks(items), [items])

  useEffect(() => {
    // Simulate API fetch with mock data
    const fetchItems = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be a fetch call
        // const response = await fetch("/api/carousel-items")
        // if (!response.ok) throw new Error("Failed to fetch carousel items")
        // const data = await response.json()

        // Using mock data for demonstration
        setTimeout(() => {
          setItems(mockItems)
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

  // Autoplay when in view
  useEffect(() => {
    if (!isInView || !autoplay || items.length === 0) return

    const interval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(interval)
  }, [isInView, nextSlide, autoplay, items.length])

  // Pause autoplay on hover
  const pauseAutoplay = () => setAutoplay(false)
  const resumeAutoplay = () => setAutoplay(true)

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
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, ease: "linear" }}
            className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"
          />
          <p className="text-lg">Loading showcase items...</p>
        </motion.div>
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
    <section 
      className="py-8 md:py-12" 
      aria-label="Showcase Carousel"
      ref={carouselRef}
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
    >
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
              onClick={prevSlide}
              disabled={items.length === 0}
              className="rounded-full bg-background/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300"
            >
              <ChevronLeft className="h-8 w-8" />
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
              onClick={nextSlide}
              disabled={items.length === 0}
              className="rounded-full bg-background/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </motion.div>

          <div className="overflow-hidden rounded-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  opacity: { duration: 0.2 }
                }}
              >
                <Card className="w-full overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                      <motion.div 
                        className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40"
                        whileHover={{ 
                          rotate: [0, -5, 5, 0],
                          scale: 1.05,
                         
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {items[currentIndex].type === "course" ? <VideoIcon /> : <QuizIcon />}
                      </motion.div>
                      <div className="flex flex-col gap-4 text-center md:text-left">
                        <div>
                          <motion.h3 
                            className="text-2xl md:text-3xl font-semibold text-primary mb-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                          >
                            {items[currentIndex].name}
                          </motion.h3>
                          <motion.p 
                            className="text-lg md:text-xl text-muted-foreground italic"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                          >
                            {items[currentIndex].tagline}
                          </motion.p>
                        </div>
                        <motion.div 
                          className="flex flex-wrap justify-center md:justify-start gap-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, duration: 0.3 }}
                        >
                          <Badge variant={items[currentIndex].type === "course" ? "default" : "secondary"}>
                            {items[currentIndex].type === "course" ? "Course" : "Quiz"}
                          </Badge>
                          {items[currentIndex].type !== "course" && (
                            <Badge variant="outline">
                              {items[currentIndex].quizType === "mcq"
                                ? "Multiple Choice"
                                : items[currentIndex].quizType === "openended"
                                  ? "Open Ended"
                                  : items[currentIndex].quizType === "fill-blanks"
                                    ? "Fill in the Blank"
                                    : "Code"}
                            </Badge>
                          )}
                        </motion.div>
                        <motion.p 
                          className="text-sm md:text-base text-muted-foreground"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5, duration: 0.3 }}
                        >
                          {items[currentIndex].description}
                        </motion.p>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6, duration: 0.3 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Link href={links[currentIndex]} className="mt-2 block">
                            <Button variant="default" className="w-full md:w-auto relative overflow-hidden group">
                              <motion.span
                                className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 group-hover:w-full"
                                initial={{ width: 0 }}
                                whileHover={{ width: "100%" }}
                              />
                              {items[currentIndex].type === "course" ? "Start Course" : "Take Quiz"}
                            </Button>
                          </Link>
                        </motion.div>
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
                  index === currentIndex ? "bg-primary" : "bg-secondary"
                }`}
                whileHover={{ scale: 1.5 }}
                whileTap={{ scale: 0.9 }}
                animate={{ 
                  scale: index === currentIndex ? [1, 1.2, 1] : 1,
                  opacity: index === currentIndex ? 1 : 0.6
                }}
                transition={{ 
                  scale: { 
                    repeat: index === currentIndex ? Number.POSITIVE_INFINITY : 0, 
                    duration: 2,
                    repeatType: "reverse"
                  }
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

