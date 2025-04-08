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
      "CourseAI has completely transformed how I create educational content. What used to take weeks now takes minutes, and the quality is even better.",
    author: "Sarah Johnson",
    role: "University Professor",
    avatar: "/placeholder.svg?height=100&width=100&text=SJ",
    id: "testimonial-1",
  },
  {
    quote:
      "As a corporate trainer, I need to create courses quickly without sacrificing quality. CourseAI delivers exactly that, saving me countless hours of work.",
    author: "Michael Chen",
    role: "Corporate Trainer",
    avatar: "/placeholder.svg?height=100&width=100&text=MC",
    id: "testimonial-2",
  },
  {
    quote:
      "The AI-generated quizzes are incredibly effective at testing comprehension. My students' retention rates have improved significantly since I started using CourseAI.",
    author: "Emily Rodriguez",
    role: "High School Teacher",
    avatar: "/placeholder.svg?height=100&width=100&text=ER",
    id: "testimonial-3",
  },
  {
    quote:
      "I was skeptical about AI-generated content, but CourseAI has exceeded all my expectations. The courses are engaging, accurate, and save me so much time.",
    author: "David Kim",
    role: "Online Course Creator",
    avatar: "/placeholder.svg?height=100&width=100&text=DK",
    id: "testimonial-4",
  },
]

const TestimonialsSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })

  const nextTestimonial = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }, [])

  const prevTestimonial = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  // Add keyboard navigation
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

  // Apple-style animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    },
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6" ref={containerRef}>
      <motion.div
        className="text-center mb-16"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.div
          variants={itemVariants}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          Testimonials
        </motion.div>

        <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold mb-6">
          What our users are saying
        </motion.h2>

        <motion.p variants={itemVariants} className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Join thousands of satisfied educators who have transformed their teaching with CourseAI
        </motion.p>
      </motion.div>

      <div className="relative max-w-4xl mx-auto">
        {/* Navigation buttons with Apple-style animations */}
        <div className="absolute top-1/2 -left-4 md:-left-12 transform -translate-y-1/2 z-10">
          <motion.div
            whileHover={{ scale: 1.1, x: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
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
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
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
                ease: [0.25, 0.1, 0.25, 1],
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
                      initial={{ opacity: 0, y: 20, rotateX: 5 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      exit={{ opacity: 0, y: -20, rotateX: -5 }}
                      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                      className="bg-card/30 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-border/10 shadow-lg text-center"
                      style={{
                        transformPerspective: "1000px",
                        willChange: "transform, opacity",
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.3 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                      >
                        <Quote className="h-12 w-12 text-primary/30 mx-auto mb-6" aria-hidden="true" />
                      </motion.div>

                      <motion.p
                        className="text-xl md:text-2xl italic mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      >
                        {testimonial.quote}
                      </motion.p>

                      <motion.div
                        className="flex items-center justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        >
                          <Avatar className="h-14 w-14 mr-4">
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
                          <div className="font-semibold">{testimonial.author}</div>
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
        <div className="flex justify-center mt-8 space-x-2" role="tablist" aria-label="Testimonial navigation">
          {testimonials.map((_, index) => (
            <motion.button
              key={index}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === activeIndex ? "bg-primary" : "bg-muted"
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to testimonial ${index + 1}`}
              aria-selected={index === activeIndex}
              role="tab"
              whileHover={{ scale: 1.5 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default TestimonialsSlider
