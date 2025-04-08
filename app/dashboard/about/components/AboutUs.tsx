"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RocketIcon, BrainIcon, UsersIcon, SparklesIcon, ArrowRight } from "lucide-react"
import Image from "next/image"

const sections = [
  {
    title: "Our Mission",
    description:
      "At CourseAI, we aim to simplify course creation by leveraging the power of AI. Our mission is to empower educators and learners worldwide with seamless tools to share knowledge.",
    icon: RocketIcon,
    color: "bg-rose-500",
  },
  {
    title: "Our Vision",
    description:
      "Our vision is to create a world where learning is accessible, affordable, and engaging for everyone. We aspire to become the go-to platform for personalized and interactive learning, helping individuals unlock their potential and achieve their goals through innovative AI-driven solutions.",
    icon: BrainIcon,
    color: "bg-cyan-500",
  },
  {
    title: "Our Team",
    description:
      "We are a team of passionate professionals with extensive experience in software development, AI, and education. Our diverse expertise allows us to create innovative solutions that make learning more effective and enjoyable for everyone.",
    icon: UsersIcon,
    color: "bg-amber-500",
  },
  {
    title: "Future Plans",
    description:
      "We're constantly innovating to improve CourseAI. Our future plans include expanding AI capabilities for more interactive courses, introducing new subscription tiers with premium features, and building a thriving community of educators and learners.",
    icon: SparklesIcon,
    color: "bg-emerald-500",
  },
]

const AboutUs = () => {
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
          We're on a mission to make learning more accessible, personalized, and effective for everyone
        </motion.p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{
              duration: 0.6,
              delay: 0.3 + index * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 h-full border-border/10 bg-card/30 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8 space-y-5 h-full flex flex-col">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${section.color} bg-opacity-20`}>
                    <section.icon className={`w-6 h-6 ${section.color.replace("bg-", "text-")}`} />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">{section.title}</h3>
                </div>
                <p className="text-muted-foreground flex-grow leading-relaxed text-base">{section.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Team section with Apple-style imagery */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mt-24 relative rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
        <div className="relative p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Meet our leadership team</h3>
            <p className="text-muted-foreground mb-6">
              Our diverse team brings together expertise in artificial intelligence, education, and product design to
              create the most intuitive and powerful course creation platform.
            </p>
            <Button className="rounded-full group" size="lg">
              Join our team
              <motion.span
                className="inline-block ml-2"
                initial={{ x: 0 }}
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </Button>
          </div>
          <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden">
            <Image
              src="/placeholder.svg?height=800&width=1200&text=Team"
              alt="CourseAI Team"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </motion.div>

      {/* Values section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mt-24 text-center"
      >
        <h3 className="text-2xl md:text-3xl font-bold mb-12">Our Values</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Innovation",
              description: "We constantly push the boundaries of what's possible with AI in education.",
              icon: "✨",
            },
            {
              title: "Accessibility",
              description: "We believe quality education should be accessible to everyone, everywhere.",
              icon: "🌍",
            },
            {
              title: "Excellence",
              description: "We're committed to delivering the highest quality tools and experiences.",
              icon: "🏆",
            },
          ].map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.9 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/10"
            >
              <div className="text-4xl mb-4">{value.icon}</div>
              <h4 className="text-xl font-semibold mb-2">{value.title}</h4>
              <p className="text-muted-foreground">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mt-24"
      >
        <Button
          size="lg"
          className="px-8 py-3 text-lg font-medium rounded-full"
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

export default AboutUs
