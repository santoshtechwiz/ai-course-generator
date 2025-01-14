'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import CourseQuizCarousel from '@/app/components/dashboard/CourseQuizCarousel'


export default function ShowcaseSection() {
  const showcaseRef = useRef(null)
  const isShowcaseInView = useInView(showcaseRef, { once: true, amount: 0.2 })

  return (
    <section ref={showcaseRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isShowcaseInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 relative text-foreground">
            <span className="text-primary">
              Course Showcase
            </span>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-primary rounded-full"></div>
          </h2>
          <CourseQuizCarousel />
        </motion.div>
      </div>
    </section>
  )
}

