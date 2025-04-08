"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Sparkles, Brain, Zap, Lightbulb, BookOpen, Layers, BarChart, Users, Shield } from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Learning",
    description:
      "Our advanced AI algorithms analyze your learning style and create personalized course content tailored to your needs.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "Smart Course Generation",
    description:
      "Transform any topic into a structured learning experience with intelligent content organization and pacing.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Instant Quizzes",
    description:
      "Generate relevant assessments automatically to test comprehension and reinforce learning at optimal intervals.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Lightbulb,
    title: "Adaptive Learning",
    description:
      "Courses that evolve based on your progress, focusing more time on challenging concepts and less on mastered material.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: BookOpen,
    title: "Rich Media Integration",
    description:
      "Seamlessly incorporate videos, interactive diagrams, and other media to enhance the learning experience.",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: Layers,
    title: "Multi-Format Content",
    description: "Access your learning materials in various formats including text, audio, and visual representations.",
    color: "from-indigo-500 to-violet-500",
  },
]

const FeatureShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })

  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6" ref={containerRef}>
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          Intelligent Features
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Revolutionize your learning experience
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Discover how our AI transforms course creation and delivers personalized learning journeys
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{
              duration: 0.6,
              delay: 0.3 + index * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div className="h-full bg-card/30 backdrop-blur-sm rounded-2xl p-8 border border-border/10 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
              />

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
      >
        <div className="p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/10">
          <BarChart className="h-10 w-10 text-primary mx-auto mb-4" />
          <div className="text-4xl font-bold mb-2">98%</div>
          <p className="text-muted-foreground">Completion rate</p>
        </div>

        <div className="p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/10">
          <Users className="h-10 w-10 text-primary mx-auto mb-4" />
          <div className="text-4xl font-bold mb-2">50k+</div>
          <p className="text-muted-foreground">Active learners</p>
        </div>

        <div className="p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/10">
          <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
          <div className="text-4xl font-bold mb-2">100%</div>
          <p className="text-muted-foreground">Satisfaction guarantee</p>
        </div>
      </motion.div>
    </div>
  )
}

export default FeatureShowcase
