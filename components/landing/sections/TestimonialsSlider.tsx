"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    quote:
      "CourseAI has completely transformed how I create educational content. What used to take weeks now takes minutes, and the quality is even better.",
    author: "Sarah Johnson",
    role: "University Professor",
    avatar: "/placeholder.svg?height=100&width=100&text=SJ",
  },
  {
    quote:
      "As a corporate trainer, I need to create courses quickly without sacrificing quality. CourseAI delivers exactly that, saving me countless hours of work.",
    author: "Michael Chen",
    role: "Corporate Trainer",
    avatar: "/placeholder.svg?height=100&width=100&text=MC",
  },
  {
    quote:
      "The AI-generated quizzes are incredibly effective at testing comprehension. My students' retention rates have improved significantly since I started using CourseAI.",
    author: "Emily Rodriguez",
    role: "High School Teacher",
    avatar: "/placeholder.svg?height=100&width=100&text=ER",
  },
  {
    quote:
      "I was skeptical about AI-generated content, but CourseAI has exceeded all my expectations. The courses are engaging, accurate, and save me so much time.",
    author: "David Kim",
    role: "Online Course Creator",
    avatar: "/placeholder.svg?height=100&width=100&text=DK",
  },
]

const TestimonialsSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6" ref={containerRef}>
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          Testimonials
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          What our users are saying
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Join thousands of satisfied educators who have transformed their teaching with CourseAI
        </motion.p>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Navigation buttons */}
        <div className="absolute top-1/2 -left-4 md:-left-12 transform -translate-y-1/2 z-10">
          <motion.div whileHover={{ scale: 1.1, x: -3 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
              onClick={prevTestimonial}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        <div className="absolute top-1/2 -right-4 md:-right-12 transform -translate-y-1/2 z-10">
          <motion.div whileHover={{ scale: 1.1, x: 3 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
              onClick={nextTestimonial}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        {/* Testimonials carousel */}
        <div className="overflow-hidden">
          <motion.div
            className="flex"
            animate={{ x: `-${activeIndex * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30, ease: [0.16, 1, 0.3, 1] }}
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="min-w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-card/30 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-border/10 shadow-lg text-center"
                >
                  <Quote className="h-12 w-12 text-primary/30 mx-auto mb-6" />
                  <p className="text-xl md:text-2xl italic mb-8">{testimonial.quote}</p>
                  <div className="flex items-center justify-center">
                    <Avatar className="h-14 w-14 mr-4">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
                      <AvatarFallback>
                        {testimonial.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === activeIndex ? "bg-primary" : "bg-muted"
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default TestimonialsSlider
