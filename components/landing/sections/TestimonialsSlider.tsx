"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Enhanced testimonials with Apple-style animations
const testimonials = [
  {
    quote:
      "CourseAI has completely transformed how I create content. What used to take days now takes minutes, and the quality is even better. The AI understands exactly what I'm trying to achieve.",
    author: "Sarah Johnson",
    role: "Digital Creator",
    avatar: "/placeholder.svg?height=100&width=100&text=SJ",
    id: "testimonial-1",
  },
  {
    quote:
      "As a professional, I need to create engaging content quickly without sacrificing quality. CourseAI delivers exactly that, saving me countless hours while helping me produce more impactful material.",
    author: "Michael Chen",
    role: "Content Strategist",
    avatar: "/placeholder.svg?height=100&width=100&text=MC",
    id: "testimonial-2",
  },
  {
    quote:
      "The AI-generated interactive elements are incredibly effective at boosting engagement. My audience's response has improved significantly since I started using CourseAI for my digital content.",
    author: "Emily Rodriguez",
    role: "Brand Consultant",
    avatar: "/placeholder.svg?height=100&width=100&text=ER",
    id: "testimonial-3",
  },
  {
    quote:
      "I was skeptical about AI-generated content, but CourseAI has exceeded all my expectations. The materials are engaging, visually appealing, and save me so much time in my creative process.",
    author: "David Kim",
    role: "Creative Director",
    avatar: "/placeholder.svg?height=100&width=100&text=DK",
    id: "testimonial-4",
  },
]

// Optimize the testimonials component for better performance and accessibility
const TestimonialsSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })
  const APPLE_EASING = [0.22, 0.61, 0.36, 1]

  // Use useCallback for navigation functions to prevent unnecessary re-renders
  const nextTestimonial = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }, [])

  const prevTestimonial = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  // Add keyboard navigation and accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextTestimonial()
      } else if (e.key === "ArrowLeft") {
        prevTestimonial()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nextTestimonial, prevTestimonial])

  // Auto-advance testimonials with pause on hover
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      nextTestimonial()
    }, 6000)

    return () => clearInterval(interval)
  }, [isPaused, nextTestimonial])

  return (
    <div
      className="container max-w-6xl mx-auto px-4 md:px-6"
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: APPLE_EASING }}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          Success Stories
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: APPLE_EASING }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          What our users are saying
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: APPLE_EASING }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Join thousands of creators who are building smarter content experiences with CourseAI
        </motion.p>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Navigation buttons with Apple-style animations */}
        <div className="absolute top-1/2 -left-4 md:-left-12 transform -translate-y-1/2 z-10">
          <motion.div
            whileHover={{ scale: 1.1, x: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: APPLE_EASING }}
          >
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
              onClick={prevTestimonial}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        <div className="absolute top-1/2 -right-4 md:-right-12 transform -translate-y-1/2 z-10">
          <motion.div
            whileHover={{ scale: 1.1, x: 3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: APPLE_EASING }}
          >
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
              onClick={nextTestimonial}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        {/* Testimonials carousel with Apple-style animations */}
        <div
          className="overflow-hidden"
          role="region"
          aria-roledescription="carousel"
          aria-label="Testimonials carousel"
          style={{ perspective: "1000px" }}
        >
          <motion.div
            className="flex"
            animate={{
              x: `-${activeIndex * 100}%`,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                ease: APPLE_EASING,
              },
            }}
            style={{ willChange: "transform" }}
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="min-w-full"
                role="group"
                aria-roledescription="slide"
                aria-label={`Testimonial ${index + 1} of ${testimonials.length}`}
                aria-hidden={activeIndex !== index}
              >
                <AnimatePresence mode="wait">
                  {activeIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, y: 30, rotateX: 10 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      exit={{ opacity: 0, y: -30, rotateX: -10 }}
                      transition={{ duration: 0.7, ease: APPLE_EASING }}
                      className="bg-card/30 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-border/10 shadow-lg text-center"
                      style={{
                        transformPerspective: "1200px",
                        willChange: "transform, opacity",
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.3 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: APPLE_EASING }}
                      >
                        <Quote className="h-14 w-14 text-primary/30 mx-auto mb-6" aria-hidden="true" />
                      </motion.div>

                      <motion.p
                        className="text-xl md:text-2xl italic mb-8 leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3, ease: APPLE_EASING }}
                      >
                        {testimonial.quote}
                      </motion.p>

                      <motion.div
                        className="flex items-center justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.4, ease: APPLE_EASING }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1, y: -2 }}
                          transition={{ duration: 0.3, ease: APPLE_EASING }}
                        >
                          <Avatar className="h-16 w-16 mr-4 border-2 border-primary/10 shadow-lg">
                            <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
                            <AvatarFallback>
                              {testimonial.author
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                        <div className="text-left">
                          <div className="font-semibold text-lg">{testimonial.author}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Dots indicator with Apple-style animations */}
        <div className="flex justify-center mt-8 space-x-3" role="tablist" aria-label="Testimonial navigation">
          {testimonials.map((_, index) => (
            <motion.button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${index === activeIndex ? "bg-primary" : "bg-muted"}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to testimonial ${index + 1}`}
              aria-selected={index === activeIndex}
              role="tab"
              whileHover={{ scale: 1.6 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3, ease: APPLE_EASING }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default TestimonialsSlider
