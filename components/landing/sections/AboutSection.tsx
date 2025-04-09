"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

import MissionIcon from "../svg/MissionIcon"
import VisionIcon from "../svg/VisionIcon"
import TeamIcon from "../svg/TeamIcon"
import ValueIcon from "../svg/ValueIcon"
import RevealAnimation from "../RevealAnimation"

const AboutSection = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })

  const sections = [
    {
      title: "Empowering Content Creators",
      description:
        "At CourseAI, we are dedicated to empowering educators, professionals, and learners by simplifying content creation. Our mission is to provide intuitive AI tools that enable anyone to share knowledge effectively and efficiently.",
      icon: MissionIcon,
      color: "from-rose-500 to-rose-600",
    },
    {
      title: "A Vision for Smarter Learning",
      description:
        "Our vision is to revolutionize the way people learn and share knowledge. By combining AI with user-friendly tools, we aim to make education more accessible, engaging, and impactful for everyone.",
      icon: VisionIcon,
      color: "from-cyan-500 to-cyan-600",
    },
    {
      title: "Driven by Passion and Expertise",
      description:
        "CourseAI is a solo-founder initiative, built with a passion for AI and education. With a strong background in technology and content creation, we are committed to delivering innovative solutions that make learning and teaching more effective.",
      icon: TeamIcon,
      color: "from-amber-500 to-amber-600",
    },
  ]

  const values = [
    {
      title: "Innovation at the Core",
      description: "We continuously explore new possibilities to enhance content creation with cutting-edge AI technology.",
      color: "from-purple-500 to-indigo-500",
    },
    {
      title: "Accessible for Everyone",
      description: "We believe that high-quality educational tools should be available to everyone, regardless of location or background.",
      color: "from-blue-500 to-sky-500",
    },
    {
      title: "Commitment to Excellence",
      description: "We strive to deliver exceptional tools and experiences that exceed expectations and drive meaningful results.",
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
          About CourseAI
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Redefining Content Creation with AI
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          CourseAI is built to simplify and accelerate the way people create, learn, and share knowledge. Using AI, we
          empower anyone—from individuals to teams—to create engaging, interactive content without the complexity. Our
          goal is simple: make knowledge sharing more accessible, customizable, and intelligent for everyone.
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
