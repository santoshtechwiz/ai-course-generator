"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import MaskReveal from "@/components/animations/MaskReveal"
import ProgressiveText from "@/components/animations/ProgressiveText"
import CountUp from "@/components/animations/CountUp"
import CTASVG from "../svg/CTASVG"
import { FeedbackButton } from "@/components/ui/feedback-button"

const CTASection = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 })
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isInView) {
    return null // Render nothing if the section is not in view
  }

  const startTrial = async () => {
    // Simulate API call or processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))
    router.push("/dashboard/subscription")
    return true
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6" ref={containerRef}>
      <div className="relative rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />

        <div className="relative p-8 md:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <MaskReveal direction="left">
                <ProgressiveText
                  text="Ready to transform your content creation?"
                  tag="h2"
                  className="text-3xl md:text-5xl font-bold mb-6 tracking-tight"
                  delay={0.2}
                />
              </MaskReveal>

              <MaskReveal direction="left" delay={0.3}>
                <p className="text-xl text-muted-foreground mb-8">
                  Join thousands of creators using CourseAI to build engaging, personalized content experiences.
                </p>
              </MaskReveal>

              <MaskReveal direction="left" delay={0.4}>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/10">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                      <CountUp end={10000} separator="," prefix="+" />
                    </div>
                    <p className="text-muted-foreground">Active users</p>
                  </div>
                  <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/10">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                      <CountUp end={50000} separator="," prefix="+" />
                    </div>
                    <p className="text-muted-foreground">Courses created</p>
                  </div>
                </div>
              </MaskReveal>

              <MaskReveal direction="left" delay={0.5}>
                <FeedbackButton
                  size="lg"
                  className="px-8 py-6 text-lg rounded-full bg-primary hover:bg-primary/90 transition-all shadow-lg"
                  loadingText="Starting trial..."
                  successText="Trial started!"
                  errorText="Please try again"
                  onClickAsync={startTrial}
                >
                  Start 1-month free trial
                  <motion.span
                    className="inline-block ml-2"
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.span>
                </FeedbackButton>
              </MaskReveal>

              <MaskReveal direction="left" delay={0.6}>
                <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-8">
                  <motion.div
                    className="flex items-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span className="text-sm">No credit card required</span>
                  </motion.div>
                  <motion.div
                    className="flex items-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span className="text-sm">1-month free trial</span>
                  </motion.div>
                </div>
              </MaskReveal>
            </div>

            <MaskReveal direction="right" delay={0.3}>
              <div className="relative h-[400px] w-full">
                <CTASVG />
              </div>
            </MaskReveal>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CTASection
