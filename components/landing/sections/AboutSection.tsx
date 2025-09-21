"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Sparkles, Star, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

import MissionIcon from "../svg/MissionIcon"
import VisionIcon from "../svg/VisionIcon"
import TeamIcon from "../svg/TeamIcon"
import RevealAnimation from "@/components/shared/RevealAnimation"

// Apple-style easing
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

const AboutSection = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })

  const sections = [
    {
      title: "Effortless Creation",
      description:
        "Transform any topic into a comprehensive course in minutes. CourseAI's advanced AI understands context, structure, and learning objectives to create engaging content that resonates with your audience.",
      icon: MissionIcon,
      color: "from-blue-500 to-indigo-500",
    },
    {
      title: "Beautiful Learning Experiences",
      description:
        "We believe great design enhances learning. CourseAI combines sophisticated AI with stunning visuals and intuitive interfaces to create courses that captivate and educate.",
      icon: VisionIcon,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Innovation Through Passion",
      description:
        "Every feature is crafted with deep care for education and user experience. We're not just building tools—we're reimagining how the world creates and shares knowledge.",
      icon: TeamIcon,
      color: "from-green-500 to-teal-500",
    },
  ]

  const values = [
    {
      title: "Innovation First",
      description:
        "We push the boundaries of what's possible with AI and education. Every update brings new capabilities that make course creation more powerful and intuitive.",
      color: "from-purple-500 to-indigo-500",
      icon: "sparkles",
    },
    {
      title: "Designed for Everyone",
      description:
        "From classroom educators to corporate trainers, CourseAI adapts to your needs. No technical expertise required—just your knowledge and our platform.",
      color: "from-blue-500 to-sky-500",
      icon: "users",
    },
    {
      title: "Privacy & Trust",
      description:
        "Your content is yours. We provide enterprise-grade security with complete control over access, ensuring your courses remain private and protected.",
      color: "from-green-500 to-emerald-500",
      icon: "star",
    },
  ]

  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6" ref={containerRef}>
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          About CourseAI
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Redefining Education
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Through Innovation
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          CourseAI represents the future of educational content creation.
          By combining artificial intelligence with thoughtful design, we empower
          educators and organizations to create extraordinary learning experiences
          that engage, inspire, and transform.
        </motion.p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{
              duration: 0.7,
              delay: 0.3 + index * 0.1,
              ease: APPLE_EASING,
            }}
          >
            <div className="overflow-hidden transition-all hover:shadow-xl hover:-translate-y-2 h-full rounded-2xl border border-border/10 bg-card/30 backdrop-blur-sm">
              <div className="p-6 sm:p-8 space-y-5 h-full flex flex-col">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full bg-gradient-to-br ${section.color} text-white shadow-lg`}>
                    <section.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">{section.title}</h3>
                </div>
                <p className="text-muted-foreground flex-grow leading-relaxed text-base">{section.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Values section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.7, delay: 0.8, ease: APPLE_EASING }}
        className="mt-24 text-center"
      >
        <h3 className="text-2xl md:text-3xl font-bold mb-12">Our Values</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <RevealAnimation key={value.title} delay={0.9 + index * 0.1}>
              <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/10 h-full flex flex-col items-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className={`p-4 rounded-full bg-gradient-to-br ${value.color} text-white mb-4 shadow-lg`}>
                  {value.icon === "sparkles" && (
                    <motion.div>
                      <svg className="w-8 h-8">
                        <Sparkles className="w-8 h-8" />
                      </svg>
                    </motion.div>
                  )}
                  {value.icon === "users" && (
                    <motion.div>
                      <svg className="w-8 h-8">
                        <Users className="w-8 h-8" />
                      </svg>
                    </motion.div>
                  )}
                  {value.icon === "star" && (
                    <motion.div>
                      <svg className="w-8 h-8">
                        <Star className="w-8 h-8" />
                      </svg>
                    </motion.div>
                  )}
                </div>
                <h4 className="text-xl font-semibold mb-2">{value.title}</h4>
                <p className="text-muted-foreground">{value.description}</p>

                <motion.div
                  className="w-12 h-1 bg-gradient-to-r from-primary/50 to-primary/0 rounded-full mt-4"
                  whileHover={{ width: 80 }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </RevealAnimation>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.7, delay: 1.2, ease: APPLE_EASING }}
        className="text-center mt-24"
      >
        <Button
          size="lg"
          className="px-8 py-3 text-lg font-medium rounded-full hover:shadow-lg hover:-translate-y-1 transition-all"
          onClick={() => (window.location.href = "/contactus")}
        >
          Get in Touch
          <motion.span
            className="inline-block ml-2"
            initial={{ x: 0 }}
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <ArrowRight className="h-4 w-4" />
          </motion.span>
        </Button>
      </motion.div>
    </div>
  )
}

export default AboutSection
