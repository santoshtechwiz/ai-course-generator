"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Zap, Lightbulb, BarChart, LineChart, Workflow, Bot, Shield } from "lucide-react"
import { RevealAnimation } from "../AppleLandingPage"

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
        duration: 0.8,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    }),
    hover: {
      y: -10,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        duration: 0.3,
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
              perspective: "1000px",
            }}
          >
            <div className="h-full bg-card/30 backdrop-blur-sm rounded-2xl p-8 border border-border/10 transition-all duration-300 relative overflow-hidden group">
              {/* Background gradient */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                whileHover={{ opacity: 0.05 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              />

              {/* Icon */}
              <motion.div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
                whileHover={{
                  scale: 1.1,
                  rotate: [0, 5, -5, 0],
                  transition: {
                    duration: 0.5,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                }}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </motion.div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Business metrics section */}
      <RevealAnimation delay={0.8} className="mt-24">
        <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/10 p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{
                  duration: 0.8,
                  delay: 0.9,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="text-2xl md:text-3xl font-bold mb-4"
              >
                Measurable business impact
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{
                  duration: 0.8,
                  delay: 1.0,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="text-muted-foreground mb-6"
              >
                Our customers see tangible results within weeks of implementation. Elevate helps businesses reduce
                manual work by up to 70% and increase operational efficiency by 35%.
              </motion.p>

              <motion.ul
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{
                  duration: 0.8,
                  delay: 1.1,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="space-y-4"
              >
                {[
                  "Reduce operational costs by automating manual processes",
                  "Minimize errors and improve data accuracy",
                  "Free up employee time for high-value activities",
                  "Make faster, data-driven business decisions",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{
                      duration: 0.5,
                      delay: 1.2 + index * 0.1,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                  >
                    <motion.div
                      className="mr-3 mt-1 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center"
                      whileHover={{ scale: 1.2 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <motion.div
                        className="h-2 w-2 rounded-full bg-primary"
                        animate={{
                          scale: [1, 1.5, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: "reverse",
                          ease: [0.25, 0.1, 0.25, 1],
                        }}
                      />
                    </motion.div>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.8,
                  delay: 1.3,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              />
              <div className="relative p-6">
                <motion.div
                  initial={{ opacity: 0, y: 20, rotate: -5 }}
                  animate={isInView ? { opacity: 1, y: 0, rotate: 0 } : { opacity: 0, y: 20, rotate: -5 }}
                  transition={{
                    duration: 0.8,
                    delay: 1.4,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  <LineChart className="h-12 w-12 text-primary mb-6" />
                </motion.div>
                <div className="space-y-6">
                  {[
                    { label: "Time Saved", value: 70 },
                    { label: "Cost Reduction", value: 45 },
                    { label: "Productivity Increase", value: 35 },
                    { label: "Error Reduction", value: 90 },
                  ].map((metric, index) => (
                    <div key={index}>
                      <motion.div
                        className="flex justify-between mb-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                        transition={{
                          duration: 0.5,
                          delay: 1.5 + index * 0.1,
                          ease: [0.25, 0.1, 0.25, 1],
                        }}
                      >
                        <span className="text-sm font-medium">{metric.label}</span>
                        <span className="text-sm font-medium">{metric.value}%</span>
                      </motion.div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={isInView ? { width: `${metric.value}%` } : { width: 0 }}
                          transition={{
                            duration: 1,
                            delay: 1.6 + index * 0.1,
                            ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealAnimation>
    </div>
  )
}

export default FeatureShowcase
