"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Quote, Code, Database, Palette, Cpu, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"
import type React from "react"

const testimonials = [
  {
    name: "Alex Chen",
    role: "Software Engineer",
    quote:
      "As a self-taught developer, this platform has been invaluable. The AI-generated quizzes help me validate my learning, and the ad-free video experience lets me focus on mastering new technologies without distractions.",
    icon: Code,
  },
  {
    name: "Priya Sharma",
    role: "Data Scientist",
    quote:
      "Balancing work and continuous learning is challenging, but this platform makes it easier. The AI-powered knowledge checks ensure I'm grasping complex concepts, and the ability to learn without ads interrupting my flow is priceless.",
    icon: Database,
  },
  {
    name: "Michael Johnson",
    role: "Self-Taught UX Designer",
    quote:
      "Transitioning careers was daunting, but this platform made self-learning accessible. The AI-assisted quizzes helped me identify knowledge gaps, and the ad-free environment allowed me to immerse myself fully in design principles.",
    icon: Palette,
  },
  {
    name: "Emily Rodriguez",
    role: "Full-Stack Developer",
    quote:
      "As someone juggling a full-time job and learning new skills, efficiency is key. This platform's AI-generated assessments and distraction-free video lectures have significantly accelerated my learning process.",
    icon: Cpu,
  },
  {
    name: "Raj Patel",
    role: "DevOps Engineer",
    quote:
      "Staying updated with the latest in DevOps is crucial. This platform's AI-curated content and quizzes help me quickly grasp new concepts. The ad-free experience means I can focus on learning during my limited free time.",
    icon: Rocket,
  },
]

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cardsPerView, setCardsPerView] = useState(1)
  const [autoplay, setAutoplay] = useState(true)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 })

  const updateCardsPerView = useCallback(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1024) {
        setCardsPerView(3)
      } else if (window.innerWidth >= 640) {
        setCardsPerView(2)
      } else {
        setCardsPerView(1)
      }
    }
  }, [])

  useEffect(() => {
    updateCardsPerView()
    window.addEventListener("resize", updateCardsPerView)
    return () => window.removeEventListener("resize", updateCardsPerView)
  }, [updateCardsPerView])

  const nextTestimonial = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % (testimonials.length - cardsPerView + 1))
  }, [cardsPerView])

  const prevTestimonial = useCallback(() => {
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex - 1 + testimonials.length - cardsPerView + 1) % (testimonials.length - cardsPerView + 1),
    )
  }, [cardsPerView])

  // Autoplay when in view
  useEffect(() => {
    if (!isInView || !autoplay) return

    const interval = setInterval(nextTestimonial, 5000)
    return () => clearInterval(interval)
  }, [isInView, nextTestimonial, autoplay])

  // Pause autoplay on hover
  const pauseAutoplay = () => setAutoplay(false)
  const resumeAutoplay = () => setAutoplay(true)

  return (
    <section
      ref={sectionRef}
      className="py-10 md:py-16 bg-gradient-to-b from-background to-secondary/20"
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
    >
      <div className="container px-4 md:px-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="overflow-hidden">
            <motion.div
              className="flex"
              animate={{
                x: `-${currentIndex * (100 / cardsPerView)}%`,
                transition: { type: "spring", stiffness: 300, damping: 30 },
              }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex-shrink-0 px-3",
                    cardsPerView === 1 ? "w-full" : cardsPerView === 2 ? "w-1/2" : "w-1/3",
                  )}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <TestimonialCard testimonial={testimonial} isHovered={hoveredCard === index} index={index} />
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 -left-4 md:-left-6"
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="rounded-full shadow-md hover:shadow-lg transition-shadow hidden md:flex"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div
            className="absolute right-0 top-1/2 -translate-y-1/2 -right-4 md:-right-6"
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="rounded-full shadow-md hover:shadow-lg transition-shadow hidden md:flex"
              aria-label="Next testimonials"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Mobile navigation dots */}
          <div className="flex justify-center mt-6 space-x-2 md:hidden">
            {Array.from({ length: testimonials.length - cardsPerView + 1 }).map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to testimonial group ${index + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-primary" : "bg-secondary"
                }`}
                whileHover={{ scale: 1.5 }}
                whileTap={{ scale: 0.9 }}
                animate={{
                  scale: index === currentIndex ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  scale: {
                    repeat: index === currentIndex ? Number.POSITIVE_INFINITY : 0,
                    duration: 2,
                    repeatType: "reverse",
                  },
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

interface Testimonial {
  name: string
  role: string
  quote: string
  icon: React.ElementType
}

interface TestimonialCardProps {
  testimonial: Testimonial
  isHovered: boolean
  index: number
}

function TestimonialCard({ testimonial, isHovered, index }: TestimonialCardProps) {
  const Icon = testimonial.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card
        className={cn(
          "h-full bg-card shadow-md transition-all duration-300",
          isHovered && "shadow-lg transform -translate-y-1",
        )}
      >
        <CardContent className="p-6 flex flex-col h-full">
          <motion.div
            className="flex items-center space-x-4 mb-4"
            animate={isHovered ? { x: [0, 5, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
              whileHover={{ rotate: 10 }}
              animate={isHovered ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Icon className="w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-base text-foreground">{testimonial.name}</h3>
              <p className="text-sm text-muted-foreground">{testimonial.role}</p>
            </div>
          </motion.div>
          <blockquote className="text-foreground flex-grow">
            <motion.div animate={isHovered ? { rotate: [0, 5, 0, -5, 0] } : {}} transition={{ duration: 1 }}>
              <Quote className="h-6 w-6 text-primary mb-2" />
            </motion.div>
            <motion.p
              className="text-base"
              animate={
                isHovered
                  ? {
                      color: ["hsl(var(--foreground))", "hsl(var(--primary))", "hsl(var(--foreground))"],
                    }
                  : {}
              }
              transition={{ duration: 1.5 }}
            >
              {testimonial.quote}
            </motion.p>
          </blockquote>
        </CardContent>
      </Card>
    </motion.div>
  )
}

