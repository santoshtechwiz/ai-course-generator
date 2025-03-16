"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, useScroll, useTransform, useSpring, type Variants } from "framer-motion"
import { Element } from "react-scroll"
import { ArrowUp, Sparkles, Lightbulb, Laptop, MessageSquare, Users, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import type React from "react"

// Import components that are needed immediately
import LandingHero from "./LandingHero"
import Navbar from "./LandingNavbar"


// Dynamically import components with loading states
const FlyingElements = dynamic(() => import("./FlyingElements"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 pointer-events-none z-0"></div>,
})

const FeatureSections = dynamic(() => import("./FeatureSection"), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-pulse">Loading features...</div>
    </div>
  ),
})

const HowItWorks = dynamic(() => import("./HowItWorks"), {
  ssr: false,
})

const FAQSection = dynamic(() => import("./FaqSection"), {
  ssr: false,
})

const ShowCaseCarousel = dynamic(() => import("./ShowCaseCarousel"), {
  ssr: false,
 
})

const TestimonialsSection = dynamic(() => import("./TestimonialsSection"), {
  ssr: false,
})

const AboutUs = dynamic(() => import("@/app/about/AboutUs"), {
  ssr: false,
})

const defaultSections = [
  {
    key: "features",
    title: "AI-Powered Learning",
    description: "Explore how our AI transforms course creation and quiz generation.",
    icon: Sparkles,
    Component: FeatureSections,
  },
  {
    key: "how-it-works",
    title: "Effortless Course Building",
    description: "See how easily you can create engaging courses and diverse quizzes with AI.",
    icon: Lightbulb,
    Component: HowItWorks,
  },
  {
    key: "showcase",
    title: "Interactive Demo",
    description: "Experience our AI-generated courses and multi-format quizzes firsthand.",
    icon: Laptop,
    Component: ShowCaseCarousel,
  },
  {
    key: "testimonials",
    title: "Success Stories",
    description: "Discover how AI is revolutionizing education for our users.",
    icon: MessageSquare,
    Component: TestimonialsSection,
  },
  {
    key: "about-us",
    title: "Our EdTech Vision",
    description: "Learn about our mission to empower educators with AI technology.",
    icon: Users,
    Component: AboutUs,
  },
  {
    key: "faq",
    title: "Frequently Asked Questions",
    description: "Get answers about AI course creation and quiz generation.",
    icon: HelpCircle,
    Component: FAQSection,
  },
]

type Section = {
  key: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  Component: React.ComponentType
  props?: any
}

type LandingComponentProps = {
  sections?: Section[]
}

const fadeInUp: Variants = {
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
  hidden: {
    opacity: 0,
    y: 50,
  },
}

const stagger: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
}

export default function LandingComponent({ sections = defaultSections }: LandingComponentProps) {
  const router = useRouter()
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [activeSection, setActiveSection] = useState("")
  const { theme } = useTheme()
  const mainRef = useRef<HTMLDivElement>(null)

  // Smooth scroll progress for parallax effects
  const { scrollYProgress } = useScroll({
    target: mainRef,
    offset: ["start start", "end end"],
  })

  const smoothScrollProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  // Parallax effect for background elements
  const backgroundY = useTransform(smoothScrollProgress, [0, 1], ["0%", "20%"])

  const handleScroll = useCallback(() => {
    setShowScrollTop(window.scrollY > 300)

    // Find the current active section based on scroll position
    const scrollPosition = window.scrollY + 200

    sections.forEach((section) => {
      const element = document.getElementById(section.key)
      if (element) {
        const { offsetTop, offsetHeight } = element
        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          setActiveSection(section.key)
        }
      }
    })
  }, [sections])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  // Preload critical components after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      // Preload components that will be needed soon
      import("./FeatureSection")
      import("./HowItWorks")
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Background parallax effect */}
      <motion.div className="fixed inset-0 z-0 opacity-30 pointer-events-none" style={{ y: backgroundY }}>
        <FlyingElements />
      </motion.div>

      <Navbar activeSection={activeSection} />

      <main ref={mainRef} className="flex-grow relative z-10">
        <LandingHero
          onTopicSubmit={(title: string): void => {
            router.push(`/dashboard/create`)
          }}
        />

        {sections.map((section, index) => (
          <Element key={section.key} name={section.key} id={section.key}>
            {index !== 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
              >
                <Separator className="my-8 md:my-16 max-w-5xl mx-auto" />
              </motion.div>
            )}
            <section className="py-8 md:py-16 px-4 md:px-8 max-w-6xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={stagger}
                className="section-container"
                data-active={activeSection === section.key}
              >
                <motion.div variants={fadeInUp} className="text-center space-y-6 mb-10">
                  <motion.div
                    className="flex justify-center items-center mb-4"
                    initial={{ scale: 0.5, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                      delay: 0.1,
                    }}
                  >
                    <div className="p-3 rounded-full bg-primary/10">
                      <section.icon className="w-6 h-6 text-primary" />
                    </div>
                  </motion.div>
                  <motion.h2
                    className="text-3xl md:text-4xl font-bold tracking-tight text-foreground"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    {section.title}
                  </motion.h2>
                  <motion.p
                    className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    {section.description}
                  </motion.p>
                </motion.div>
                <motion.div
                  variants={fadeInUp}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7 }}
                >
                  <section.Component {...(section.props || {})} />
                </motion.div>
              </motion.div>
            </section>
          </Element>
        ))}
      </main>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: showScrollTop ? 1 : 0,
          scale: showScrollTop ? 1 : 0.8,
          y: showScrollTop ? 0 : 20,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          variant="default"
          size="icon"
          className="rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  )
}

