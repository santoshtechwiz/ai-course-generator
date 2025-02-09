"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, GraduationCap, ClipboardList, PenLine, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface CarouselItem {
  id: string
  name: string
  slug:string
  description: string
  quizType: "course" | "mcq" | "openended" | "fill-blanks" | "code"
  type: "course" | "quiz"
}

const quizIcons: Record<CarouselItem["quizType"], React.ElementType> = {
  course: GraduationCap,
  mcq: ClipboardList,
  openended: PenLine,
  "fill-blanks": FileText,
  code: FileText,
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
        console.log(data)
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

  const TypeIcon = quizIcons[items[currentIndex].quizType]

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <Button
        variant="outline"
        size="icon"
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full"
        onClick={prevSlide}
        disabled={items.length === 0}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full"
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
            <Card className="w-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    {TypeIcon && <TypeIcon className="h-8 w-8 text-primary" />}
                    <CardTitle className="text-2xl">{items[currentIndex].name}</CardTitle>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline">{items[currentIndex].type === "course" ? "Course" : "Quiz"}</Badge>
                    {items[currentIndex].type !== "course" && (
                      <Badge variant="secondary">
                        {items[currentIndex].quizType === "mcq"
                          ? "Multiple Choice"
                          : items[currentIndex].quizType === "openended"
                          ? "Open Ended"
                          : "Fill in the Blank"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-lg">{items[currentIndex].description}</p>
              </CardContent>
              <CardFooter>
                <Button variant="default" size="lg" className="w-full text-lg">
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
          
           
            className={`w-3 h-3 rounded-full p-0 ${index === currentIndex ? "bg-primary" : "bg-secondary"}`}
           href={buildLinks(items)[index]}
          />
        ))}
      </div>
    </div>
  )
}

export default ShowCaseCarousel
