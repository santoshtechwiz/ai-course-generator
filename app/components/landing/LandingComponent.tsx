"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion, type Variants } from "framer-motion"
import { Element } from "react-scroll"
import { ArrowUp, Sparkles, Lightbulb, Laptop, MessageSquare, Users, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type React from "react"

import FeatureSections from "@/app/components/landing/FeatureSection"
import HowItWorks from "@/app/components/landing/HowItWorks"
import FAQSection from "./FaqSection"
import Navbar from "./LandingNavbar"
import LandingHero from "./LandingHero"

const ShowcaseSection = dynamic(() => import("./ShowCaseCarousel"), { ssr: false })
const TestimonialsSection = dynamic(() => import("./TestimonialsSection"), { ssr: false })
const AboutUs = dynamic(() => import("@/app/about/AboutUs"), { ssr: false })

const fadeInUp: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 80, damping: 15 },
  },
}

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

type SectionConfig = {
  key: string
  title: string
  description: string
  Component: React.ComponentType<any>
  props?: any
  icon: React.ElementType
}

type LandingComponentProps = {
  sections?: SectionConfig[]
}

const defaultSections: SectionConfig[] = [
  { key: "features", title: "Features", description: "Discover unique platform features", Component: FeatureSections, icon: Sparkles },
  { key: "how-it-works", title: "How it Works", description: "Learn how our platform empowers learning", Component: HowItWorks, icon: Lightbulb },
  { key: "showcase", title: "Explore Our Platform", description: "Interactive courses and engaging quizzes", Component: ShowcaseSection, icon: Laptop },
  { key: "testimonials", title: "Testimonials", description: "What our users say", Component: TestimonialsSection, icon: MessageSquare },
  { key: "about", title: "About Us", description: "Meet our team", Component: AboutUs, icon: Users },
  { key: "faq", title: "FAQ", description: "Answers to common questions", Component: FAQSection, icon: HelpCircle },
]

export default function LandingComponent({ sections = defaultSections }: LandingComponentProps) {
  const router = useRouter()
  const [showScrollTop, setShowScrollTop] = useState(false)

  const handleScroll = useCallback(() => {
    setShowScrollTop(window.scrollY > 300)
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-grow">
        <LandingHero onTopicSubmit={function (topic: string): void {
          throw new Error("Function not implemented.")
        } } />

        {sections.map((section, index) => (
          <Element key={section.key} name={section.key}>
            {index !== 0 && <Separator className="my-4 md:my-16" />}
            <section className="py-4 md:py-16 lg:py-20 px-6 md:px-12 max-w-5xl mx-auto">
              <motion.div initial={false} whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
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

      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: showScrollTop ? 1 : 0, scale: showScrollTop ? 1 : 0.8 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="fixed bottom-4 right-4 z-50">
        <Button variant="default" size="icon" className="rounded-full shadow-lg bg-primary hover:bg-primary/90" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <ArrowUp className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  )
}
