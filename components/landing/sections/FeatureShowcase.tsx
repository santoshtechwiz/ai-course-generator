"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { useGlobalLoader } from "@/store/loaders/global-loader"

// SVG icons for features
const FeatureIcon = ({ type }: { type: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8"
    >
      {type === "create" && (
        <>
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </>
      )}
      {type === "quiz" && (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </>
      )}
      {type === "custom" && (
        <>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </>
      )}
      {type === "track" && (
        <>
          <path d="M2 12h10" />
          <path d="M9 4v16" />
          <path d="M14 9l3 3-3 3" />
          <path d="M12 12h8" />
        </>
      )}
      {type === "private" && (
        <>
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </>
      )}
    </svg>
  )
}

// Features data
const features = [
  {
    icon: "create",
    title: "Create Courses Instantly",
    description: "Enter a topic—CourseAI auto-generates a full course with structured lessons and quizzes using AI.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: "quiz",
    title: "AI Quiz Generation",
    description: "Automatically generate quizzes from your course content. No manual question writing needed.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: "custom",
    title: "Create Your Own Quizzes",
    description: "Build custom quizzes with MCQs, coding tasks, fill-in-the-blanks, and open-ended questions.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: "track",
    title: "Progress Tracking",
    description: "Monitor learner activity—track quiz scores, completion status, and engagement easily.",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    icon: "private",
    title: "Private Course Creation",
    description: "Keep your courses private and secure. Only you and the people you allow can access them.",
    gradient: "from-purple-500 to-violet-500",
  },
]

// Apple-style easing function
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

const FeatureShowcase = () => {
  const [reduceMotion, setReduceMotion] = useState(false)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)")
      setReduceMotion(media.matches)
      const handler = () => setReduceMotion(media.matches)
      media.addEventListener("change", handler)
      return () => media.removeEventListener("change", handler)
    }
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })

  // Optimized text animation variants
  const textVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0.01 : 0.6,
        delay: reduceMotion ? 0 : delay,
        ease: APPLE_EASING,
      },
    }),
  }

  // Optimized card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: reduceMotion ? 0.01 : 0.5,
        delay: reduceMotion ? 0 : delay,
        ease: APPLE_EASING,
      },
    }),
    hover: {
      y: -4,
      scale: 1.01,
      boxShadow: "0 10px 20px -8px rgba(0, 0, 0, 0.1)",
      transition: {
        duration: reduceMotion ? 0.01 : 0.2,
        ease: APPLE_EASING,
      },
    },
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6" ref={containerRef}>
      <div className="text-center mb-16">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={textVariants}
          custom={0}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          Powerful Features
        </motion.div>

        <motion.h2
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={textVariants}
          custom={0.1}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Create Engaging Content with AI
        </motion.h2>

        <motion.p
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={textVariants}
          custom={0.2}
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          CourseAI empowers you to create dynamic, personalized content—automatically. From interactive experiences to
          complete learning journeys, build and share faster than ever.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            whileHover="hover"
            variants={cardVariants}
            custom={0.3 + index * 0.05}
            style={{
              willChange: "transform, opacity",
              perspective: "800px",
            }}
          >
            <div className="h-full bg-card/30 backdrop-blur-sm rounded-2xl p-8 border border-border/10 transition-all duration-300 relative overflow-hidden group">
              {/* Background gradient */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                whileHover={{ opacity: 0.06 }}
                transition={{ duration: 0.3, ease: APPLE_EASING }}
              />

              {/* Icon */}
              <motion.div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg text-white`}
                whileHover={{
                  scale: 1.05,
                  rotate: [0, 2, -2, 0],
                  transition: {
                    duration: 0.5,
                    ease: APPLE_EASING,
                  },
                }}
              >
                <FeatureIcon type={feature.icon} />
              </motion.div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

              {/* Arrow indicator */}
              <motion.div
                className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ x: -3, opacity: 0 }}
                whileHover={{ x: 0, opacity: 1 }}
              >
                <ArrowRight className="h-5 w-5 text-primary/70" />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default FeatureShowcase
