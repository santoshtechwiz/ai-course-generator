"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, type Variants } from "framer-motion"
import { Element } from "react-scroll"
import { ArrowUp, Sparkles, Lightbulb, Laptop, MessageSquare, Users, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import type React from "react"

import LandingHero from "./LandingHero"
import FlyingElements from "./FlyingElements"
import Navbar from "./LandingNavbar"
import FAQSection from "./FaqSection"
import FeatureSections from "./FeatureSection"
import HowItWorks from "./HowItWorks"

const ShowcaseSection = dynamic(() => import("./ShowCaseCarousel"), { ssr: false })
const TestimonialsSection = dynamic(() => import("./TestimonialsSection"), { ssr: false })
const AboutUs = dynamic(() => import("@/app/about/AboutUs"), { ssr: false })

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
    Component: ShowcaseSection,
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
];
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
  const { theme, setTheme } = useTheme()

  const handleScroll = useCallback(() => {
    setShowScrollTop(window.scrollY > 300)
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      <FlyingElements />
      <Navbar />
      <main className="flex-grow relative z-10">
        <LandingHero
          onTopicSubmit={(topic: string): void => {
            router.push(`/dashboard/create`);
          }}
        />

        {sections.map((section, index) => (
          <Element key={section.key} name={section.key}>
            {index !== 0 && <Separator className="my-4 md:my-16" />}
            <section className="py-4 md:py-16 lg:py-20 px-6 md:px-12 max-w-5xl mx-auto">
              <motion.div
                initial={false}
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={stagger}
              >
                <motion.div variants={fadeInUp} className="text-center space-y-4 mb-6">
                  <div className="flex justify-center items-center mb-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <section.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-bold text-primary">{section.title}</h2>
                  <p className="text-muted-foreground text-lg sm:text-xl">{section.description}</p>
                </motion.div>
                <motion.div variants={fadeInUp}>
                  <section.Component {...(section.props || {})} />
                </motion.div>
              </motion.div>
            </section>
          </Element>
        ))}
      </main>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: showScrollTop ? 1 : 0, scale: showScrollTop ? 1 : 0.8 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          variant="default"
          size="icon"
          className="rounded-full shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </motion.div>

     
    </div>
  )
}

