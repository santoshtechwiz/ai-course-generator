'use client'

import { useState } from 'react'
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

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="w-full py-12 px-4 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto">
        <h2 className="text-2xl font-semibold tracking-tighter text-center mb-8 sm:text-3xl md:text-4xl lg:text-5xl">
          Empowering Self-Learners & Professionals
        </h2>
        <div className="relative max-w-4xl mx-auto">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-10">
              <blockquote className="text-lg sm:text-xl font-medium mb-4 italic">
                "{testimonials[currentIndex].quote}"
              </blockquote>
              <cite className="block text-right not-italic">
                <span className="font-semibold">{testimonials[currentIndex].name}</span>
                <span className="block text-sm text-gray-500">{testimonials[currentIndex].role}</span>
              </cite>
            </CardContent>
          </Card>
          <div className="flex justify-between mt-6">
            <Button variant="outline" size="icon" onClick={prevTestimonial} className="bg-white hover:bg-gray-100">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous testimonial</span>
            </Button>
            <Button variant="outline" size="icon" onClick={nextTestimonial} className="bg-white hover:bg-gray-100">
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next testimonial</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

