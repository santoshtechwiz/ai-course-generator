'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Book, HelpCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CarouselItem {
  id: number
  name: string
  description: string
  type: 'course' | 'quiz'
  slug: string
}

const CACHE_KEY = 'carouselItems'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const BackgroundPattern = () => (
  <div className="absolute inset-0 w-full h-full overflow-hidden">
    <svg
      className="absolute top-0 left-0 w-full h-full opacity-[0.07] text-primary"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
          <path
            d="M25,17.3205081 L50,0 L50,34.641016 L25,51.9615242 L0,34.641016 L0,0 Z"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
        </pattern>
        <pattern id="circles" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
          <circle cx="15" cy="15" r="6" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
        <linearGradient id="fadeGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexagons)" />
      <rect width="100%" height="100%" fill="url(#circles)" />
      <rect width="100%" height="100%" fill="url(#fadeGradient)" />
    </svg>
    
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
  </div>
)

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

        const response = await fetch('/api/carousel-items')
        if (!response.ok) {
          throw new Error('Failed to fetch carousel items')
        }
        const fetchedItems = await response.json()

        localStorage.setItem(CACHE_KEY, JSON.stringify({ items: fetchedItems, timestamp: Date.now() }))
        setItems(fetchedItems)
      } catch (error) {
        console.error('Error fetching carousel items:', error)
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

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length)
  }

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
      <Button
        variant="outline"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous slide</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
        onClick={nextSlide}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
      
      <div className="overflow-hidden rounded-xl">
        <div className="relative min-h-[400px]">
          <AnimatePresence initial={false} custom={currentIndex}>
            <motion.div
              key={currentIndex}
              custom={currentIndex}
              variants={{
                enter: (direction: number) => ({
                  opacity: 0,
                  x: direction > 0 ? "100%" : "-100%",
                }),
                center: {
                  opacity: 1,
                  x: 0,
                },
                exit: (direction: number) => ({
                  opacity: 0,
                  x: direction < 0 ? "100%" : "-100%",
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute w-full h-full"
            >
              <Card className="w-full h-full mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden border-primary/10">
                <BackgroundPattern />
                <div className="relative z-10 flex flex-col h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-4 text-2xl">
                      {items[currentIndex].type === "course" ? (
                        <Book className="text-primary h-6 w-6" />
                      ) : (
                        <HelpCircle className="text-primary h-6 w-6" />
                      )}
                      {items[currentIndex].name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {items[currentIndex].description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end pt-6">
                    <Link href={`/dashboard/${items[currentIndex].type}/${items[currentIndex].slug}`}>
                      <Button
                        size="lg"
                        className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {items[currentIndex].type === "course" ? "Start Course" : "Take Quiz"}
                      </Button>
                    </Link>
                  </CardFooter>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      <div className="flex justify-center gap-2 mt-6">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-colors",
              index === currentIndex
                ? "bg-primary"
                : "bg-primary/20"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

