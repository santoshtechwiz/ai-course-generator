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
      title: "YouTube Course Creation",
      description:
        "Create structured courses using YouTube video links. Organize lessons from existing videos into chapters and build comprehensive learning paths that engage your audience.",
      icon: MissionIcon,
      color: "from-blue-500 to-indigo-500",
    },
    {
      title: "AI Quiz Generation",
      description:
        "Generate intelligent quizzes from YouTube video transcripts. Create multiple-choice, coding challenges, fill-in-the-blanks, and open-ended questions with AI assistance.",
      icon: VisionIcon,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Progress Tracking",
      description:
        "Monitor learner engagement and completion rates. Track quiz performance, video viewing progress, and provide detailed analytics for effective learning management.",
      icon: TeamIcon,
      color: "from-green-500 to-teal-500",
    },
  ]

  const values = [
    {
      title: "AI-Powered Assistance",
      description:
        "Leverage AI to generate quizzes from transcripts and get personalized recommendations. Our AI tools enhance your course creation process without replacing your expertise.",
      color: "from-purple-500 to-indigo-500",
      icon: "sparkles",
    },
    {
      title: "User-Friendly Design",
      description:
        "CourseAI features modern Neobrutalism design that's clean, bold, and responsive. Create and manage courses with an intuitive interface that works seamlessly.",
      color: "from-blue-500 to-sky-500",
      icon: "users",
    },
    {
      title: "Secure & Private",
      description:
        "Your content remains secure and private. Control access to your courses and quizzes, with enterprise-grade security ensuring your educational materials are protected.",
      color: "from-green-500 to-emerald-500",
      icon: "star",
    },
  ]

  return (
    <div className="w-full px-4" ref={containerRef}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block px-4 py-2 rounded-sm bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-6 border-3 border-[var(--color-primary)]/30"
          >
            About CourseAI
          </motion.div>

          <motion.h2
            id="about-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-6xl font-black mb-6 tracking-tight"
          >
            AI-Powered Learning
            <br />
            Made Simple
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-medium"
          >
            CourseAI helps you create courses using YouTube videos and generate intelligent quizzes using AI. Build
            structured learning experiences, track progress, and share your content effectively.
          </motion.p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-20">
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
              <div className="overflow-hidden transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] h-full rounded-sm border-4 border-[var(--color-primary)] bg-[var(--color-card)] shadow-[6px_6px_0px_0px_var(--color-primary)] hover:shadow-[8px_8px_0px_0px_var(--color-primary)]">
                <div className="p-8 space-y-5 h-full flex flex-col">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-sm bg-[var(--color-primary)] text-[var(--color-bg)] border-3 border-[var(--color-primary)] shadow-[3px_3px_0px_0px_var(--color-primary)]">
                      <section.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight">{section.title}</h3>
                  </div>
                  <p className="text-muted-foreground flex-grow leading-relaxed text-base font-medium">
                    {section.description}
                  </p>
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
          <h3 className="text-3xl md:text-4xl font-black mb-12 tracking-tight">Our Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <RevealAnimation key={value.title} delay={0.9 + index * 0.1}>
                <div className="bg-card rounded-sm p-8 border-4 border-accent h-full flex flex-col items-center shadow-[6px_6px_0px_0px_var(--accent)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_var(--accent)] transition-all duration-200">
                  <div className="p-4 rounded-sm bg-accent text-accent-foreground border-3 border-accent mb-6 shadow-[3px_3px_0px_0px_var(--accent)]">
                    {value.icon === "sparkles" && <Sparkles className="w-8 h-8" />}
                    {value.icon === "users" && <Users className="w-8 h-8" />}
                    {value.icon === "star" && <Star className="w-8 h-8" />}
                  </div>
                  <h4 className="text-xl font-black mb-3 tracking-tight">{value.title}</h4>
                  <p className="text-muted-foreground font-medium leading-relaxed">{value.description}</p>
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
            className="px-8 py-4 text-lg font-black rounded-sm bg-primary text-primary-foreground border-3 border-primary shadow-[4px_4px_0px_0px_var(--primary)] hover:translate-x-[2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--primary)] transition-all duration-200"
            onClick={() => (window.location.href = "/contactus")}
          >
            Get in Touch
            <motion.span
              className="inline-block ml-2"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <ArrowRight className="h-5 w-5" />
            </motion.span>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

export default AboutSection
