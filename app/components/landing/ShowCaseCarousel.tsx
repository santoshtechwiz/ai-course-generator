"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, PlayCircle, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface CarouselItem {
  id: string
  name: string
  slug: string
  description: string
  quizType?: "mcq" | "openended" | "fill-blanks" | "code"
  type: "course" | "quiz"
}

const buildLinks = (items: CarouselItem[]) => {
  return items.map((item) => {
    if (item.type === "course") {
      return `/courses/dashboard/${item.slug}`
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
    return `/quiz/${item.slug}`
  })
}

const ShowCaseCarousel = () => {
  const [items, setItems] = useState<CarouselItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/carousel-items")
        if (!response.ok) throw new Error("Failed to fetch carousel items")
        const data = await response.json()
        setItems(data)
      } catch (error) {
        console.error("Error fetching carousel items:", error)
      }
    }

    fetchItems()
  }, [])

  const nextSlide = () => {
    if (items.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
    }
  }

  const prevSlide = () => {
    if (items.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length)
    }
  }

  if (items.length === 0) {
    return <div className="text-center text-lg">Loading...</div>
  }

  return (
    <section className="py-4 md:py-24 lg:py-32 bg-gradient-to-b from-background to-secondary/20">
      <div className="container px-4 md:px-6">
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full hidden md:flex"
            onClick={prevSlide}
            disabled={items.length === 0}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full hidden md:flex"
            onClick={nextSlide}
            disabled={items.length === 0}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="w-full overflow-hidden">
                  <div className="relative h-48 bg-gradient-to-r from-primary to-primary-foreground">
                    {items[currentIndex].type === "course" ? (
                      <PlayCircle className="absolute inset-0 m-auto h-32 w-32 text-background opacity-50" />
                    ) : (
                      <HelpCircle className="absolute inset-0 m-auto h-32 w-32 text-background opacity-50" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h3 className="text-4xl font-bold text-background">
                        {items[currentIndex].type === "course" ? "Interactive Course" : "Engaging Quiz"}
                      </h3>
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <CardTitle className="text-2xl">{items[currentIndex].name}</CardTitle>
                      <div className="flex flex-wrap gap-2">
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
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{items[currentIndex].description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="default" size="lg" className="w-full">
                      {items[currentIndex].type === "course" ? "Start Course" : "Take Quiz"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex justify-center mt-6 space-x-2">
            {items.map((_, index) => (
              <Link
                key={index}
                href={buildLinks(items)[index]}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ShowCaseCarousel

