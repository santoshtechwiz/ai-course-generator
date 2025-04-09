"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Zap, CreditCard, FileText, HelpCircle, Layers, Users, Youtube } from "lucide-react"

// Update the features array to be more broadly appealing
const features = [
  {
    icon: Youtube,
    title: "Video Integration",
    description: "Effortlessly create comprehensive content by leveraging existing YouTube videos on any topic.",
    gradient: "from-red-500 to-pink-500",
    color: "from-red-500 to-pink-500",
  },
  {
    icon: FileText,
    title: "Automated Transcripts",
    description: "Generate accurate transcripts automatically from video content to enhance your materials.",
    gradient: "from-blue-500 to-cyan-500",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: HelpCircle,
    title: "Smart Quiz Generation",
    description:
      "Create engaging quizzes with multiple question types including MCQs, open-ended, and fill-in-the-blanks.",
    gradient: "from-green-500 to-emerald-500",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Layers,
    title: "Customizable Content",
    description: "Tailor content and structure to meet your specific goals and audience needs.",
    gradient: "from-purple-500 to-violet-500",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Zap,
    title: "Quick Creation",
    description: "Build full-fledged content in minutes, making creation accessible for everyone.",
    gradient: "from-yellow-500 to-orange-500",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Users,
    title: "Inclusive Learning",
    description: "Cater to diverse learning styles with a mix of video, text, and interactive elements.",
    gradient: "from-indigo-500 to-blue-500",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: CreditCard,
    title: "Flexible Pricing Plans",
    description: "Choose from Free, Basic, and Pro plans to suit your creation needs and budget.",
    gradient: "from-pink-500 to-rose-500",
    color: "from-pink-500 to-rose-500",
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
        {/* Update the feature showcase section to appeal to a broader audience */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={textVariants}
          custom={0}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          Smarter Content Creation
        </motion.div>

        <motion.h2
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={textVariants}
          custom={0.1}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Build Interactive Content in Minutes with AI
        </motion.h2>

        <motion.p
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={textVariants}
          custom={0.2}
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          CourseAI lets anyone create dynamic, personalized content—automatically. From tutorials and quizzes to
          complete learning experiences, build and share faster than ever.
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
