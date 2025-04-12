"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Zap, FileText, HelpCircle, Layers, Users, ArrowRight } from "lucide-react"

// Update the features array to be more engaging and clear
const features = [
  {
    icon: Zap,
    title: "Create Courses Instantly",
    description: "Enter a topic—CourseAI auto-generates a full course with structured lessons and quizzes using AI.",
    gradient: "from-yellow-500 to-orange-500",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: FileText,
    title: "AI Quiz Generation",
    description: "Automatically generate quizzes from your course content. No manual question writing needed.",
    gradient: "from-blue-500 to-cyan-500",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: HelpCircle,
    title: "Create Your Own Quizzes",
    description: "Build custom quizzes with MCQs, coding tasks, fill-in-the-blanks, and open-ended questions.",
    gradient: "from-green-500 to-emerald-500",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Users,
    title: "Progress Tracking",
    description: "Monitor learner activity—track quiz scores, completion status, and engagement easily.",
    gradient: "from-indigo-500 to-blue-500",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: Layers,
    title: "Private Course Creation",
    description: "Keep your courses private and secure. Only you and the people you allow can access them.",
    gradient: "from-purple-500 to-violet-500",
    color: "from-purple-500 to-violet-500",
  },
]

// Optimize feature showcase animations
const FeatureShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })

  // Optimize text animation variants
  const textVariants = {
    hidden: { opacity: 0, y: 15 }, // Reduced from 20
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7, // Reduced from 0.8
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    }),
  }

  // Optimize card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 }, // Reduced from 30
    visible: (delay) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7, // Reduced from 0.8
        delay,
        ease: [0.22, 0.61, 0.36, 1],
      },
    }),
    hover: {
      y: -8, // Reduced from -10
      scale: 1.01, // Reduced from 1.02
      boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.1)", // Reduced shadow
      transition: {
        duration: 0.3, // Reduced from 0.4
        ease: [0.22, 0.61, 0.36, 1],
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
            custom={0.3 + index * 0.1}
            style={{
              willChange: "transform, opacity",
              perspective: "1000px", // Reduced from 1200px
            }}
          >
            <div className="h-full bg-card/30 backdrop-blur-sm rounded-2xl p-8 border border-border/10 transition-all duration-300 relative overflow-hidden group">
              {/* Optimize background gradient animation */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                whileHover={{ opacity: 0.06 }} // Reduced from 0.08
                transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }} // Reduced from 0.4
              />

              {/* Optimize icon animation */}
              <motion.div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
                whileHover={{
                  scale: 1.05, // Reduced from 1.1
                  rotate: [0, 2, -2, 0], // Reduced from [0, 3, -3, 0]
                  transition: {
                    duration: 0.5, // Reduced from 0.6
                    ease: [0.22, 0.61, 0.36, 1],
                  },
                }}
              >
                <feature.icon className="h-8 w-8 text-white" />
              </motion.div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

              {/* Optimize arrow indicator animation */}
              <motion.div
                className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ x: -3, opacity: 0 }} // Reduced from -5
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
