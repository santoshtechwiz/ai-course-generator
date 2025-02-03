"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const testimonials = [
  {
    name: "Alex Chen",
    role: "Software Engineer",
    quote:
      "As a self-taught developer, this platform has been invaluable. The AI-generated quizzes help me validate my learning, and the ad-free video experience lets me focus on mastering new technologies without distractions.",
    avatar: "/placeholder.svg?height=80&width=80",
    accentColor: "bg-blue-500",
  },
  {
    name: "Priya Sharma",
    role: "Data Scientist",
    quote:
      "Balancing work and continuous learning is challenging, but this platform makes it easier. The AI-powered knowledge checks ensure I'm grasping complex concepts, and the ability to learn without ads interrupting my flow is priceless.",
    avatar: "/placeholder.svg?height=80&width=80",
    accentColor: "bg-purple-500",
  },
  {
    name: "Michael Johnson",
    role: "Self-Taught UX Designer",
    quote:
      "Transitioning careers was daunting, but this platform made self-learning accessible. The AI-assisted quizzes helped me identify knowledge gaps, and the ad-free environment allowed me to immerse myself fully in design principles.",
    avatar: "/placeholder.svg?height=80&width=80",
    accentColor: "bg-pink-500",
  },
  {
    name: "Emily Rodriguez",
    role: "Full-Stack Developer",
    quote:
      "As someone juggling a full-time job and learning new skills, efficiency is key. This platform's AI-generated assessments and distraction-free video lectures have significantly accelerated my learning process.",
    avatar: "/placeholder.svg?height=80&width=80",
    accentColor: "bg-green-500",
  },
  {
    name: "Raj Patel",
    role: "DevOps Engineer",
    quote:
      "Staying updated with the latest in DevOps is crucial. This platform's AI-curated content and quizzes help me quickly grasp new concepts. The ad-free experience means I can focus on learning during my limited free time.",
    avatar: "/placeholder.svg?height=80&width=80",
    accentColor: "bg-orange-500",
  },
]

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  useEffect(() => {
    const autoPlay = setInterval(nextTestimonial, 8000)
    return () => clearInterval(autoPlay)
  }, [nextTestimonial]) // Added nextTestimonial to dependencies

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary">
            Empowering Self-Learners & Professionals
          </h2>
          <p className="max-w-[900px] text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-zinc-400">
            Hear from our community of learners who have transformed their careers and skills with our platform.
          </p>
        </div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mt-12">
          <div className="relative">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <TestimonialCard testimonial={testimonials[currentIndex]} />
              </motion.div>
            </AnimatePresence>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 md:-left-12 lg:-left-16">
              <Button
                variant="outline"
                size="icon"
                onClick={prevTestimonial}
                className="rounded-full shadow-md hover:shadow-lg transition-shadow"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous testimonial</span>
              </Button>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 md:-right-12 lg:-right-16">
              <Button
                variant="outline"
                size="icon"
                onClick={nextTestimonial}
                className="rounded-full shadow-md hover:shadow-lg transition-shadow"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next testimonial</span>
              </Button>
            </div>
          </div>
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentIndex ? "bg-primary w-4" : "bg-primary/30",
                )}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

interface Testimonial {
  name: string
  role: string
  quote: string
  avatar: string
  accentColor: string
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="w-full">
      <CardContent className="p-6 sm:p-8 md:p-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="flex-shrink-0">
            <div className={cn("w-20 h-20 rounded-full overflow-hidden", testimonial.accentColor)}>
              <img
                src={testimonial.avatar || "/placeholder.svg"}
                alt={testimonial.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex-grow text-center sm:text-left">
            <blockquote className="text-lg sm:text-xl font-medium mb-4 text-foreground">
              "{testimonial.quote}"
            </blockquote>
            <cite className="not-italic">
              <div className="font-semibold text-primary">{testimonial.name}</div>
              <div className="text-sm text-muted-foreground">{testimonial.role}</div>
            </cite>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

