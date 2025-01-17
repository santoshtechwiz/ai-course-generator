'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'

const testimonials = [
  {
    name: "Alex Chen",
    role: "Software Engineer",
    quote: "As a self-taught developer, this platform has been invaluable. The AI-generated quizzes help me validate my learning, and the ad-free video experience lets me focus on mastering new technologies without distractions."
  },
  {
    name: "Priya Sharma",
    role: "Data Scientist",
    quote: "Balancing work and continuous learning is challenging, but this platform makes it easier. The AI-powered knowledge checks ensure I'm grasping complex concepts, and the ability to learn without ads interrupting my flow is priceless."
  },
  {
    name: "Michael Johnson",
    role: "Self-Taught UX Designer",
    quote: "Transitioning careers was daunting, but this platform made self-learning accessible. The AI-assisted quizzes helped me identify knowledge gaps, and the ad-free environment allowed me to immerse myself fully in design principles."
  },
  {
    name: "Emily Rodriguez",
    role: "Full-Stack Developer",
    quote: "As someone juggling a full-time job and learning new skills, efficiency is key. This platform's AI-generated assessments and distraction-free video lectures have significantly accelerated my learning process."
  },
  {
    name: "Raj Patel",
    role: "DevOps Engineer",
    quote: "Staying updated with the latest in DevOps is crucial. This platform's AI-curated content and quizzes help me quickly grasp new concepts. The ad-free experience means I can focus on learning during my limited free time."
  }
]

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      nextTestimonial()
    }, 10000)

    return () => clearInterval(timer)
  }, [currentIndex])

  const nextTestimonial = () => {
    setDirection(1)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setDirection(-1)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  return (
    <section className="w-full py-12 px-4 md:py-24 lg:py-32 bg-gradient-to-b from-background to-background/50 overflow-hidden">
      <motion.div 
        className="container mx-auto"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold tracking-tighter text-center mb-8 sm:text-3xl md:text-4xl lg:text-5xl text-foreground">
          Empowering Self-Learners & Professionals
        </h2>
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            className="absolute top-0 left-0 w-64 h-64 -z-10"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 10, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            <BlobSVG className="w-full h-full text-primary/10" />
          </motion.div>
          <motion.div
            className="absolute bottom-0 right-0 w-64 h-64 -z-10"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -10, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            <BlobSVG className="w-full h-full text-secondary/10" />
          </motion.div>
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-10">
              <QuoteSVG className="w-12 h-12 text-primary mb-4" />
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
                >
                  <blockquote className="text-lg sm:text-xl font-medium mb-4 italic text-foreground">
                    "{testimonials[currentIndex].quote}"
                  </blockquote>
                  <cite className="block text-right not-italic">
                    <span className="font-semibold text-foreground">{testimonials[currentIndex].name}</span>
                    <span className="block text-sm text-muted-foreground">{testimonials[currentIndex].role}</span>
                  </cite>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
          <div className="flex justify-between mt-6">
            <Button variant="outline" size="icon" onClick={prevTestimonial}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous testimonial</span>
            </Button>
            <Button variant="outline" size="icon" onClick={nextTestimonial}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next testimonial</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export const QuoteSVG: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
  </svg>
);

export const BlobSVG: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fill="currentColor" d="M44.9,-76.8C58.3,-69.1,69.4,-57.2,77.9,-43.5C86.4,-29.8,92.3,-14.9,92.9,0.3C93.4,15.6,88.6,31.1,80.3,44.9C72,58.7,60.2,70.7,46.3,78.3C32.5,85.9,16.2,89.1,0.1,88.9C-16,88.8,-32,85.3,-46.3,77.7C-60.6,70.1,-73.1,58.4,-81.5,44.3C-89.9,30.2,-94.1,15.1,-93.9,0.1C-93.7,-14.9,-89.1,-29.8,-80.8,-43C-72.5,-56.2,-60.6,-67.7,-46.8,-75.2C-32.9,-82.8,-16.5,-86.4,-0.2,-86C16,-85.6,31.5,-84.5,44.9,-76.8Z" transform="translate(100 100)" />
  </svg>
);

