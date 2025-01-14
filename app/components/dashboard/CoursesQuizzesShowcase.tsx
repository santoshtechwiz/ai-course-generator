'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface CarouselItem {
  id: string
  name: string
  slug: string
  description: string
  type: 'course' | 'quiz'
}

export default function CoursesQuizzesShowcase() {
  const [items, setItems] = useState<CarouselItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/carousel-items')
        if (!response.ok) {
          throw new Error('Failed to fetch carousel items')
        }
        const data = await response.json()
        setItems(data)
        setIsLoading(false)
      } catch (err) {
        setError('Failed to load courses and quizzes. Please try again later.')
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length)
  }

  if (isLoading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Featured Courses and Quizzes</h2>
          <div className="flex justify-center">
            <Skeleton className="w-full max-w-md h-64" />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Featured Courses and Quizzes</h2>
          <div className="text-center text-red-500">{error}</div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Featured Courses and Quizzes</h2>
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
            onClick={nextSlide}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex justify-center"
              >
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">{items[currentIndex].name}</CardTitle>
                      <Badge variant={items[currentIndex].type === 'course' ? 'default' : 'secondary'}>
                        {items[currentIndex].type === 'course' ? 'Course' : 'Quiz'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{items[currentIndex].description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <Button variant="default">
                      {items[currentIndex].type === 'course' ? 'Learn More' : 'Start Quiz'}
                    </Button>
                    <div className="flex space-x-2">
                      {items.map((_, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className={`w-2 h-2 rounded-full p-0 ${
                            index === currentIndex ? 'bg-primary' : 'bg-secondary'
                          }`}
                          onClick={() => setCurrentIndex(index)}
                        />
                      ))}
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

