"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RevealAnimation } from "../AppleLandingPage"
import MissionIcon from "../svg/MissionIcon"
import VisionIcon from "../svg/VisionIcon"
import TeamIcon from "../svg/TeamIcon"
import ValueIcon from "../svg/ValueIcon"

const AboutSection = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })

  const sections = [
    {
      title: "Our Mission",
      description:
        "At CourseAI, I aim to simplify course creation by leveraging the power of AI. My mission is to empower educators and learners worldwide with seamless tools to share knowledge.",
      icon: MissionIcon,
      color: "from-rose-500 to-rose-600",
    },
    {
      title: "Our Vision",
      description:
        "My vision is to create a world where learning is accessible, affordable, and engaging for everyone. I aspire to make CourseAI the go-to platform for personalized and interactive learning, helping individuals unlock their potential.",
      icon: VisionIcon,
      color: "from-cyan-500 to-cyan-600",
    },
    {
      title: "Our Team",
      description:
        "CourseAI is a solo-founder project, built with passion and dedication. As an independent developer with a strong background in AI and education, I personally handle everything — from design to development — to create innovative solutions that make learning more effective and enjoyable.",
      icon: TeamIcon,
      color: "from-amber-500 to-amber-600",
    },
  ]

  const values = [
    {
      title: "Innovation",
      description: "I constantly push the boundaries of what's possible with AI in education.",
      color: "from-purple-500 to-indigo-500",
    },
    {
      title: "Accessibility",
      description: "I believe quality education should be accessible to everyone, everywhere.",
      color: "from-blue-500 to-sky-500",
    },
    {
      title: "Excellence",
      description: "I'm committed to delivering the highest quality tools and experiences.",
      color: "from-orange-500 to-amber-500",
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
          About Us
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Transforming education through AI
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          I'm on a mission to make learning more accessible, personalized, and effective through AI-powered tools and hands-on experiences.
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
              ease: [0.25, 0.1, 0.25, 1],
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
        transition={{ duration: 0.7, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="mt-24 text-center"
      >
        <h3 className="text-2xl md:text-3xl font-bold mb-12">My Values</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <RevealAnimation key={value.title} delay={0.9 + index * 0.1}>
              <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/10 h-full flex flex-col items-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className={`p-4 rounded-full bg-gradient-to-br ${value.color} text-white mb-4 shadow-lg`}>
                  <ValueIcon index={index} className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-semibold mb-2">{value.title}</h4>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            </RevealAnimation>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.7, delay: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
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
