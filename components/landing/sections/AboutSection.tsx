"use client"

import { useRef } from "react"
import { motion, useInView, useScroll, useTransform, useSpring } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import MissionIcon from "../svg/MissionIcon"
import VisionIcon from "../svg/VisionIcon"
import TeamIcon from "../svg/TeamIcon"
import FutureIcon from "../svg/FutureIcon"
import TeamIllustration from "../svg/TeamIllustration"
import ValueIcon from "../svg/ValueIcon"
import { useMobile } from "@/hooks/use-mobile"

const AboutSection = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })
  const isMobile = useMobile()

  // Parallax scrolling effect with spring physics for smoother animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  // Use spring for smoother animations
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  const y = useTransform(smoothProgress, [0, 1], [0, -50])
  const opacity = useTransform(smoothProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6])

  const sections = [
    {
      title: "Our Mission",
      description:
        "At CourseAI, we aim to simplify course creation by leveraging the power of AI. Our mission is to empower educators and learners worldwide with seamless tools to share knowledge.",
      icon: MissionIcon,
      color: "from-rose-500 to-rose-600",
    },
    {
      title: "Our Vision",
      description:
        "Our vision is to create a world where learning is accessible, affordable, and engaging for everyone. We aspire to become the go-to platform for personalized and interactive learning, helping individuals unlock their potential.",
      icon: VisionIcon,
      color: "from-cyan-500 to-cyan-600",
    },
    {
      title: "Our Team",
      description:
        "We are a team of passionate professionals with extensive experience in artificial intelligence and education. Our diverse expertise allows us to create innovative solutions that make learning more effective and enjoyable for everyone.",
      icon: TeamIcon,
      color: "from-amber-500 to-amber-600",
    },
    {
      title: "Future Plans",
      description:
        "We're constantly innovating to improve CourseAI. Our future plans include expanding AI capabilities for more interactive courses, introducing new subscription tiers with premium features, and building a thriving community.",
      icon: FutureIcon,
      color: "from-emerald-500 to-emerald-600",
    },
  ]

  // Create dynamic transforms for each section with different offsets for 3D effect
  const sectionYTransforms = sections.map((_, index) =>
    useTransform(smoothProgress, [0, 1], [0, -20 * (index % 2 === 0 ? 1 : -1)]),
  )

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
    <motion.div className="container max-w-6xl mx-auto px-4 md:px-6" ref={containerRef} style={{ opacity }}>
      <div className="text-center mb-16">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={textVariants}
          custom={0}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          About Us
        </motion.div>

        <motion.h2
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={textVariants}
          custom={0.1}
          className="text-3xl md:text-5xl font-bold mb-6 tracking-tight"
        >
          Transforming education through AI
        </motion.h2>

        <motion.p
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={textVariants}
          custom={0.2}
          className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          We're on a mission to make learning more accessible, personalized, and effective for everyone
        </motion.p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            whileHover="hover"
            variants={cardVariants}
            custom={0.3 + index * 0.1}
            style={{
              y: sectionYTransforms[index],
              willChange: "transform, opacity",
              perspective: "1000px",
            }}
          >
            <div className="overflow-hidden transition-all h-full rounded-2xl border border-border/10 bg-card/30 backdrop-blur-sm">
              <div className="p-6 sm:p-8 space-y-5 h-full flex flex-col">
                <div className="flex items-center space-x-4">
                  <motion.div
                    className={`p-3 rounded-full bg-gradient-to-br ${section.color} text-white shadow-md`}
                    whileHover={{
                      scale: 1.1,
                      rotate: [0, 5, -5, 0],
                      transition: {
                        duration: 0.5,
                        ease: [0.25, 0.1, 0.25, 1],
                        repeat: 0,
                      },
                    }}
                  >
                    <section.icon className="w-6 h-6" />
                  </motion.div>
                  <h3 className="text-xl font-semibold tracking-tight">{section.title}</h3>
                </div>
                <p className="text-muted-foreground flex-grow leading-relaxed text-base">{section.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Team section with enhanced Apple-style SVG illustration */}
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={cardVariants}
        custom={0.7}
        className="mt-24 relative rounded-2xl overflow-hidden"
        style={{
          willChange: "transform, opacity",
          perspective: "1000px",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
        <div className="relative p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                duration: 0.8,
                delay: 0.8,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="text-2xl md:text-3xl font-bold mb-4 tracking-tight"
            >
              Meet our leadership team
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                duration: 0.8,
                delay: 0.9,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="text-muted-foreground mb-6"
            >
              Our diverse team brings together expertise in artificial intelligence, education, and product design to
              create the most intuitive and powerful course creation platform.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                duration: 0.8,
                delay: 1.0,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <Button
                className="rounded-full group"
                size="lg"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 25px -5px rgba(var(--primary-rgb), 0.3)",
                }}
                whileTap={{ scale: 0.98 }}
              >
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
            </motion.div>
          </div>
          <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden flex items-center justify-center">
            <TeamIllustration />
          </div>
        </div>
      </motion.div>

      {/* Values section with enhanced Apple-style animations */}
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={cardVariants}
        custom={0.8}
        className="mt-24 text-center"
      >
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{
            duration: 0.8,
            delay: 1.1,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="text-2xl md:text-3xl font-bold mb-12 tracking-tight"
        >
          Our Values
        </motion.h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Innovation",
              description: "We constantly push the boundaries of what's possible with AI in education.",
              color: "from-purple-500 to-indigo-500",
            },
            {
              title: "Accessibility",
              description: "We believe quality education should be accessible to everyone, everywhere.",
              color: "from-blue-500 to-sky-500",
            },
            {
              title: "Excellence",
              description: "We're committed to delivering the highest quality tools and experiences.",
              color: "from-orange-500 to-amber-500",
            },
          ].map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 30, rotateX: 10 }}
              animate={
                isInView
                  ? {
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      transition: {
                        duration: 0.8,
                        delay: 1.2 + index * 0.1,
                        ease: [0.25, 0.1, 0.25, 1],
                      },
                    }
                  : { opacity: 0, y: 30, rotateX: 10 }
              }
              whileHover={{
                y: -10,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                transition: {
                  duration: 0.3,
                  ease: [0.25, 0.1, 0.25, 1],
                },
              }}
              style={{
                transformPerspective: "1000px",
                willChange: "transform, opacity",
              }}
              className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/10 h-full flex flex-col items-center transition-all duration-300"
            >
              <motion.div
                className={`p-4 rounded-full bg-gradient-to-br ${value.color} text-white mb-4 shadow-md`}
                whileHover={{
                  scale: 1.1,
                  rotate: [0, 5, -5, 0],
                  transition: {
                    duration: 0.5,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                }}
              >
                <ValueIcon index={index} className="w-8 h-8" />
              </motion.div>
              <h4 className="text-xl font-semibold mb-2">{value.title}</h4>
              <p className="text-muted-foreground">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{
          duration: 0.8,
          delay: 1.5,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="text-center mt-24"
      >
        <Button
          size="lg"
          className="px-8 py-3 text-lg font-medium rounded-full"
          onClick={() => (window.location.href = "/contactus")}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 10px 25px -5px rgba(var(--primary-rgb), 0.3)",
          }}
          whileTap={{ scale: 0.98 }}
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
    </motion.div>
  )
}

export default AboutSection
