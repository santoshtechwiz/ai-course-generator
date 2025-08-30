"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"

// Apple-style easing
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

// Clean SVG icons for features
const FeatureIcon = ({ type }: { type: string }) => {
  const iconClass = "h-6 w-6 text-blue-600 dark:text-blue-400"

  switch (type) {
    case "create":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2v20M17 7H7m10 4H7m10 4H7m10 4H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case "quiz":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case "custom":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case "track":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3v18h18M7 16l3-3 3 3 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case "private":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    case "integrate":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 4h.01M16 20h.01M8 4h.01M8 20h.01M12 4h.01M12 20h.01M4 8v.01M4 12v.01M4 16v.01M20 8v.01M20 12v.01M20 16v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    default:
      return null
  }
}

// Features data with cleaner descriptions
const features = [
  {
    icon: "create",
    title: "Instant Course Creation",
    description: "Simply enter any topic and watch as CourseAI transforms it into a comprehensive, structured course with engaging lessons and interactive content.",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    icon: "quiz",
    title: "Smart Quiz Generation",
    description: "AI-powered quiz creation that adapts to your content. Generate multiple choice, coding challenges, and open-ended questions automatically.",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    icon: "custom",
    title: "Custom Learning Paths",
    description: "Design personalized learning journeys with flexible modules, prerequisites, and branching paths that adapt to learner progress.",
    gradient: "from-green-500 to-green-600",
  },
  {
    icon: "track",
    title: "Advanced Analytics",
    description: "Deep insights into learner engagement, completion rates, and knowledge retention with beautiful, actionable dashboards.",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    icon: "private",
    title: "Enterprise Security",
    description: "Bank-level security with enterprise-grade encryption, SSO integration, and compliance with GDPR, HIPAA, and other standards.",
    gradient: "from-red-500 to-red-600",
  },
  {
    icon: "integrate",
    title: "Seamless Integration",
    description: "Connect with your existing tools and platforms. API access, webhooks, and native integrations with popular LMS systems.",
    gradient: "from-indigo-500 to-indigo-600",
  },
]

const FeatureShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.1 })

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: APPLE_EASING }}
      >
        <h2
          className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          id="features-heading"
        >
          Everything you need to create
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            extraordinary courses
          </span>
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
          CourseAI combines powerful AI with intuitive design to help you create engaging,
          interactive learning experiences that captivate and educate your audience.
        </p>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            className="group relative"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              duration: 0.6,
              delay: index * 0.1,
              ease: APPLE_EASING
            }}
          >
            <div className="h-full bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 mb-6 group-hover:scale-110 transition-transform duration-300">
                <FeatureIcon type={feature.icon} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Subtle gradient overlay */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      <motion.div
        className="text-center mt-16"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.8, ease: APPLE_EASING }}
      >
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Ready to transform your teaching?
        </p>
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-950/50 rounded-full border border-blue-200 dark:border-blue-800">
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Start creating in under 5 minutes
          </span>
        </div>
      </motion.div>
    </div>
  )
}

export default FeatureShowcase
