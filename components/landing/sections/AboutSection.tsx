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
    <div className="w-full" ref={containerRef}>
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          About CourseAI
        </motion.div>

        <motion.h2
          id="about-heading"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          AI-Powered Learning
          <br />
          Made Simple
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          CourseAI helps you create courses using YouTube videos and generate intelligent quizzes using AI.
          Build structured learning experiences, track progress, and share your content effectively.
        </motion.p>
      </div>

  <div className="grid gap-8 md:grid-cols-2 lg:gap-12 max-w-6xl mx-auto">
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
            <div className="overflow-hidden transition-none hover:translate-x-[2px] hover:translate-y-[-2px] h-full rounded-sm border-2 border-border bg-card shadow-[4px_4px_0px_0px_var(--border)] hover:shadow-[6px_6px_0px_0px_var(--border)]">
              <div className="p-6 sm:p-8 space-y-5 h-full flex flex-col">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-sm bg-main text-main-foreground border-2 border-border shadow-[2px_2px_0px_0px_var(--border)]">
                    <section.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">{section.title}</h3>
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
              <div className="bg-card rounded-sm p-6 border-2 border-border h-full flex flex-col items-center shadow-[4px_4px_0px_0px_var(--border)] hover:translate-x-[2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--border)] transition-none">
                <div className="p-4 rounded-sm bg-muted border-2 border-border mb-4 shadow-[2px_2px_0px_0px_var(--border)]">
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
          className="px-4 sm:px-6 py-3 text-lg font-medium rounded-full hover:shadow-lg hover:-translate-y-1 transition-all"
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
