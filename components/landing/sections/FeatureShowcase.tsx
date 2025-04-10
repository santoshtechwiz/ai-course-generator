"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Zap, FileText, HelpCircle, Layers, Users, Youtube, ArrowRight } from "lucide-react"

// Update the features array to be more engaging and clear
const features = [
  {
    icon: Youtube,
    title: "Smart Video Integration",
    description:
      "Seamlessly incorporate existing videos into your content with AI-powered analysis that extracts key points and creates interactive elements.",
    gradient: "from-red-500 to-pink-500",
    color: "from-red-500 to-pink-500",
  },
  {
    icon: FileText,
    title: "Intelligent Content Analysis",
    description:
      "Our AI automatically analyzes and organizes content, creating structured materials that engage your audience.",
    gradient: "from-blue-500 to-cyan-500",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: HelpCircle,
    title: "Interactive Elements",
    description:
      "Create engaging interactive components including quizzes, polls, and dynamic content that adapts to user behavior.",
    gradient: "from-green-500 to-emerald-500",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Layers,
    title: "Customizable Experiences",
    description: "Tailor every aspect of your content to match your brand and audience needs with intuitive controls.",
    gradient: "from-purple-500 to-violet-500",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Zap,
    title: "Rapid Creation",
    description: "Build professional-quality content in minutes instead of hours, with AI handling the complex work.",
    gradient: "from-yellow-500 to-orange-500",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Users,
    title: "Audience Insights",
    description: "Gain valuable data on how users interact with your content to continuously improve engagement.",
    gradient: "from-indigo-500 to-blue-500",
    color: "from-indigo-500 to-blue-500",
  },
]

const FeatureShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })

  // Text animation variants with Apple-style easing
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    }),
  }

  // Card animation variants with enhanced Apple-style effects
  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 1.2,
        delay,
        ease: [0.22, 0.61, 0.36, 1], // Enhanced Apple-style easing
      },
    }),
    hover: {
      y: -16,
      scale: 1.03,
      boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.15)",
      transition: {
        duration: 0.5,
        ease: [0.22, 0.61, 0.36, 1], // Enhanced Apple-style easing
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
              perspective: "1200px",
            }}
          >
            <div className="h-full bg-card/30 backdrop-blur-sm rounded-2xl p-8 border border-border/10 transition-all duration-300 relative overflow-hidden group">
              {/* Enhanced background gradient */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                whileHover={{ opacity: 0.1 }}
                transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
              />

              {/* Enhanced icon animation */}
              <motion.div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
                whileHover={{
                  scale: 1.15,
                  rotate: [0, 5, -5, 0],
                  transition: {
                    duration: 0.8,
                    ease: [0.22, 0.61, 0.36, 1],
                  },
                }}
              >
                <feature.icon className="h-8 w-8 text-white" />
              </motion.div>

              {/* Content with enhanced typography */}
              <h3 className="text-xl font-semibold mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

              {/* Subtle arrow indicator that appears on hover */}
              <motion.div
                className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ x: -5, opacity: 0 }}
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
