"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Zap, Lightbulb, BarChart, Workflow, Bot, Shield } from "lucide-react"

const features = [
  {
    icon: Workflow,
    title: "Workflow Automation",
    description:
      "Automate repetitive tasks and complex business processes with our intuitive drag-and-drop workflow builder.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Bot,
    title: "AI-Powered Insights",
    description:
      "Leverage machine learning algorithms to analyze your business data and receive actionable recommendations.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Real-time Processing",
    description:
      "Process transactions and data in real-time, enabling immediate decision-making and faster response times.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Lightbulb,
    title: "Smart Suggestions",
    description:
      "Receive intelligent suggestions for process improvements based on your team's usage patterns and industry benchmarks.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: BarChart,
    title: "Advanced Analytics",
    description:
      "Gain deep insights into your business operations with comprehensive dashboards and customizable reports.",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Protect your business data with enterprise-grade security features, encryption, and compliance tools.",
    color: "from-indigo-500 to-violet-500",
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

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    }),
    hover: {
      y: -12,
      boxShadow: "0 22px 40px -12px rgba(0, 0, 0, 0.1), 0 10px 20px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
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
          Transform your business operations
        </motion.h2>

        <motion.p
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={textVariants}
          custom={0.2}
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Discover how our platform streamlines workflows, reduces costs, and drives business growth
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
                whileHover={{ opacity: 0.08 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              />

              {/* Enhanced icon animation */}
              <motion.div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
                whileHover={{
                  scale: 1.1,
                  rotate: [0, 5, -5, 0],
                  transition: {
                    duration: 0.6,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                }}
              >
                <feature.icon className="h-7 w-7 text-white" />
              </motion.div>

              {/* Content with enhanced typography */}
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default FeatureShowcase
