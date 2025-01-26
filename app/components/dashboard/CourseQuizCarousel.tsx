"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ListChecks,
  PenLine,
  FileText,
  Loader2,
  GraduationCap,
  Timer,
  Brain,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface CarouselItem {
  id: number
  name: string
  description: string
  type: "course" | "mcq" | "openended" | "fill-in-the-blank"
  slug: string
  estimatedTime?: string
  difficulty?: "Beginner" | "Intermediate" | "Advanced"
}

const CACHE_KEY = "carouselItems"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const TypeIcon = ({ type }: { type: CarouselItem["type"] }) => {
  const iconProps = {
    className: "w-32 h-32 opacity-10 absolute right-4 top-4 transition-transform group-hover:scale-110",
  }
  switch (type) {
    case "course":
      return <GraduationCap {...iconProps} />
    case "mcq":
      return <ListChecks {...iconProps} />
    case "openended":
      return <PenLine {...iconProps} />
    case "fill-in-the-blank":
      return <FileText {...iconProps} />
    default:
      return null
  }
}

const getTypeStyles = (type: CarouselItem["type"]) => {
  switch (type) {
    case "course":
      return {
        gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
        accent: "bg-blue-500/20",
        border: "border-blue-500/20",
        buttonVariant: "default" as const,
      }
    case "mcq":
      return {
        gradient: "from-green-500/20 via-green-500/5 to-transparent",
        accent: "bg-green-500/20",
        border: "border-green-500/20",
        buttonVariant: "secondary" as const,
      }
    case "openended":
      return {
        gradient: "from-purple-500/20 via-purple-500/5 to-transparent",
        accent: "bg-purple-500/20",
        border: "border-purple-500/20",
        buttonVariant: "secondary" as const,
      }
    case "fill-in-the-blank":
      return {
        gradient: "from-orange-500/20 via-orange-500/5 to-transparent",
        accent: "bg-orange-500/20",
        border: "border-orange-500/20",
        buttonVariant: "secondary" as const,
      }
    default:
      return {
        gradient: "from-primary/20 via-primary/5 to-transparent",
        accent: "bg-primary/20",
        border: "border-primary/20",
        buttonVariant: "default" as const,
      }
  }
}

export default function CourseQuizCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [items, setItems] = useState<CarouselItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCarouselItems = async () => {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY)
        if (cachedData) {
          const { items, timestamp } = JSON.parse(cachedData)
          if (Date.now() - timestamp < CACHE_DURATION) {
            setItems(items)
            setIsLoading(false)
            return
          }
        }

        const response = await fetch("/api/carousel-items")
        if (!response.ok) throw new Error("Failed to fetch carousel items")
        const fetchedItems = await response.json()

        localStorage.setItem(CACHE_KEY, JSON.stringify({ items: fetchedItems, timestamp: Date.now() }))
        setItems(fetchedItems)
      } catch (error) {
        console.error("Error fetching carousel items:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCarouselItems()
  }, [])

  useEffect(() => {
    if (items.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [items])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">No items available.</p>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto px-4 py-8">
      <motion.div
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="secondary"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
          onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="sr-only">Previous slide</span>
        </Button>
      </motion.div>

      <motion.div
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="secondary"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
          onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
        >
          <ChevronRight className="h-6 w-6" />
          <span className="sr-only">Next slide</span>
        </Button>
      </motion.div>

      <div className="overflow-hidden rounded-xl">
        <div className="relative min-h-[400px]">
          <AnimatePresence initial={false} mode="wait">
            {items.map(
              (item, index) =>
                index === currentIndex && (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute inset-0"
                  >
                    <Card
                      className={cn("w-full h-full group relative overflow-hidden", getTypeStyles(item.type).border)}
                    >
                      <div
                        className={cn(
                          "absolute inset-0 bg-gradient-to-br transition-opacity duration-300",
                          getTypeStyles(item.type).gradient,
                        )}
                      />
                      <TypeIcon type={item.type} />
                      <div className="relative z-10 flex flex-col h-full p-6">
                        <CardHeader className="flex-1">
                          <div className="flex items-center gap-2 mb-4">
                            <Badge variant="secondary" className={cn(getTypeStyles(item.type).accent)}>
                              {item.type === "course" ? "Course" : "Quiz"}
                            </Badge>
                            {item.type !== "course" && (
                              <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                                {item.type
                                  .split("-")
                                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(" ")}
                              </Badge>
                            )}
                          </div>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <CardTitle className="text-3xl font-bold mb-2">{item.name}</CardTitle>
                            <CardDescription className="text-lg">{item.description}</CardDescription>
                          </motion.div>
                        </CardHeader>
                        <CardFooter className="flex flex-col gap-4">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {item.estimatedTime && (
                              <div className="flex items-center gap-1">
                                <Timer className="h-4 w-4" />
                                <span>{item.estimatedTime}</span>
                              </div>
                            )}
                            {item.difficulty && (
                              <div className="flex items-center gap-1">
                                <Brain className="h-4 w-4" />
                                <span>{item.difficulty}</span>
                              </div>
                            )}
                          </div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                            <Link href={`/dashboard/${item.type}/${item.slug}`} className="w-full">
                              <Button
                                variant={getTypeStyles(item.type).buttonVariant}
                                size="lg"
                                className="w-full text-lg font-semibold"
                              >
                                {item.type === "course" ? "Start Learning" : "Take Quiz"}
                              </Button>
                            </Link>
                          </motion.div>
                        </CardFooter>
                      </div>
                    </Card>
                  </motion.div>
                ),
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-center gap-3 mt-6">
        {items.map((item, index) => (
          <motion.button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              index === currentIndex
                ? getTypeStyles(items[currentIndex].type).accent
                : "bg-primary/20 hover:bg-primary/40",
            )}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

