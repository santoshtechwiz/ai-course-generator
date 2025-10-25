"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FeaturesSkeleton } from "../skeletons"

// Apple-style easing
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

// Clean SVG icons for features
const FeatureIcon = ({ type }: { type: string }) => {
  const iconClass = "h-6 w-6 text-primary-foreground"

  switch (type) {
    case "create":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2v20M17 7H7m10 4H7m10 4H7m10 4H7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "quiz":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path
            d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case "custom":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "track":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 3v18h18M7 16l3-3 3 3 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "private":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case "integrate":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M16 4h.01M16 20h.01M8 4h.01M8 20h.01M12 4h.01M12 20h.01M4 8v.01M4 12v.01M4 16v.01M20 8v.01M20 12v.01M20 16v.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return null
  }
}

// Features data with cleaner descriptions - Neobrutalism style
const features = [
  {
    icon: "create",
    title: "YOUTUBE COURSE CREATION",
    description:
      "Create structured courses using YouTube video links. Organize lessons into chapters and build comprehensive learning paths from existing video content.",
  },
  {
    icon: "quiz",
    title: "AI QUIZ GENERATION",
    description:
      "Generate intelligent quizzes from YouTube video transcripts. Create multiple-choice, coding challenges, fill-in-the-blanks, and open-ended questions automatically.",
  },
  {
    icon: "custom",
    title: "PERSONALIZED LEARNING",
    description:
      "Get AI-driven recommendations for course content and quiz questions. Tailor learning experiences based on individual progress and preferences.",
  },
  {
    icon: "track",
    title: "PROGRESS TRACKING",
    description:
      "Monitor learner engagement and completion rates. Track quiz performance and video progress with detailed analytics and insights.",
  },
]

const FeatureShowcase = () => {
  // we rely on framer-motion's built-in viewport detection via `whileInView`
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => setIsLoading(false), 100)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <FeaturesSkeleton />
  }

  return (
    <div className="w-full px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header - More like n8n */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: APPLE_EASING }}
        >
          <h2 id="features-heading" className="text-4xl md:text-6xl font-black text-foreground mb-6 tracking-tight">
            BUILD COURSES AND GENERATE
            <br />
            INTELLIGENT QUIZZES
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto font-medium">
            Create video-based learning experiences with AI assistance. Generate quizzes from transcripts and track
            learner progress effectively.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: APPLE_EASING,
              }}
            >
              <div className="h-full bg-[var(--color-card)] p-8 border-4 border-[var(--color-primary)] shadow-[8px_8px_0px_0px_var(--color-primary)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_var(--color-primary)] transition-all duration-200 rounded-sm">
                {/* Icon */}
                <div className="flex items-center justify-center w-16 h-16 border-4 border-[var(--color-border)] bg-[var(--color-primary)] text-[var(--color-bg)] mb-6 shadow-[4px_4px_0px_0px_var(--color-border)] rounded-sm">
                  <FeatureIcon type={feature.icon} />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-black text-foreground mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, delay: 0.8, ease: APPLE_EASING }}
        >
          <div className="inline-flex items-center gap-4 px-8 py-4 border-4 border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-bg)] shadow-[6px_6px_0px_0px_var(--color-primary)] hover:translate-x-[2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_var(--color-primary)] transition-all duration-200 rounded-sm">
            <span className="text-lg font-black">START BUILDING YOUR COURSE</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default FeatureShowcase
