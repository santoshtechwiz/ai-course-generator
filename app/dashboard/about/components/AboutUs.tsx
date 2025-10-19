"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Sparkles, Star, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

// SVG icons
const MissionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <path
      d="M12 2L4.5 10 8 12l-3.5 8L12 14l-3.5-2L12 2z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 2l7.5 8-3.5 2 3.5 8-7.5-6 3.5-2L12 2z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const VisionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <path
      d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TeamIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <path
      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M22 21v-2a4 4 0 0 0-3-3.87"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 3.13a4 4 0 0 1 0 7.75"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Apple-style easing function
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

const AboutSection = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })

  const sections = [
    {
      title: "Effortless Course Creation",
      description:
        "CourseAI helps you create courses using YouTube videos and generate intelligent quizzes. Build structured learning experiences with YouTube integration and AI assistance for quiz generation.",
      icon: MissionIcon,
      color: "from-rose-500 to-rose-600",
    },
    {
      title: "Efficient, Impactful Learning",
      description:
        "We believe that learning should be both effective and accessible. CourseAI combines sophisticated AI with an intuitive design to help you build, customize, and deliver engaging courses.",
      icon: VisionIcon,
      color: "from-cyan-500 to-cyan-600",
    },
    {
      title: "Passion-Driven Innovation",
      description:
        "Built with a deep passion for education and AI, CourseAI is designed to address real challenges in course creation with speed, focus, and quality.",
      icon: TeamIcon,
      color: "from-amber-500 to-amber-600",
    },
  ]

  const values = [
    {
      title: "Innovation at the Core",
      description:
        "We continually explore new methods to enhance course creation and quiz automation using the latest in AI technology.",
      color: "from-purple-500 to-indigo-500",
      icon: "sparkles",
    },
    {
      title: "Accessible for Everyone",
      description:
        "CourseAI is designed with creators, educators, and teams of all technical levels in mind, making course creation simple and effective.",
      color: "from-blue-500 to-sky-500",
      icon: "users",
    },
    {
      title: "Private & Secure Courses",
      description:
        "Manage your courses with complete control over access and progress tracking, ensuring that your content remains private and secure.",
      color: "from-orange-500 to-amber-500",
      icon: "star",
    },
  ]

  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6" ref={containerRef}>
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: APPLE_EASING }}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          About CourseAI
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: APPLE_EASING }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Redefining Course Creation with AI
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: APPLE_EASING }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          CourseAI simplifies the process of designing comprehensive online courses by automatically generating lessons
          and quizzes from a simple topic input. Focus on delivering quality education while our platform handles the
          content structure.
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
                    <section.icon />
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
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.9 + index * 0.1, ease: APPLE_EASING }}
            >
              <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/10 h-full flex flex-col items-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className={`p-4 rounded-full bg-gradient-to-br ${value.color} text-white mb-4 shadow-lg`}>
                  {value.icon === "sparkles" && <Sparkles className="w-8 h-8" />}
                  {value.icon === "users" && <Users className="w-8 h-8" />}
                  {value.icon === "star" && <Star className="w-8 h-8" />}
                </div>
                <h4 className="text-xl font-semibold mb-2">{value.title}</h4>
                <p className="text-muted-foreground">{value.description}</p>

                <motion.div
                  className="w-12 h-1 bg-gradient-to-r from-primary/50 to-primary/0 rounded-full mt-4"
                  whileHover={{ width: 80 }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
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
            whileHover={{ x: 3 }}
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
