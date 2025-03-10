"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useAnimation, useInView } from "framer-motion"
import { Element } from "react-scroll"
import { Youtube, FileText, HelpCircle, Layers, Zap, Users, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Youtube,
    title: "YouTube Integration",
    description: "Effortlessly create comprehensive courses by leveraging existing YouTube videos on any topic.",
    gradient: "from-red-500 to-pink-500",
  },
  {
    icon: FileText,
    title: "Automated Transcripts",
    description: "Generate accurate transcripts automatically from video content to enhance learning materials.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: HelpCircle,
    title: "Smart Quiz Generation",
    description:
      "Create engaging quizzes with multiple question types including MCQs, open-ended, and fill-in-the-blanks.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Layers,
    title: "Customizable Content",
    description: "Tailor course content and structure to meet specific learning objectives and student needs.",
    gradient: "from-purple-500 to-violet-500",
  },
  {
    icon: Zap,
    title: "Quick Course Creation",
    description: "Build full-fledged courses in minutes, making course creation accessible for everyone.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Users,
    title: "Inclusive Learning",
    description: "Cater to diverse learning styles with a mix of video, text, and interactive elements.",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    icon: CreditCard,
    title: "Flexible Pricing Plans",
    description: "Choose from Free, Basic, and Pro plans to suit your course creation needs and budget.",
    gradient: "from-pink-500 to-rose-500",
  },
]

const FeatureSections = () => {
  const controls = useAnimation()
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  return (
    <Element name="features">
      <section ref={sectionRef} className="py-6 px-4 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            animate={controls}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            className="space-y-8"
          >
            <motion.div
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 50 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.6,
                        ease: "easeOut",
                      },
                    },
                  }}
                  whileHover={{
                    scale: 1.03,
                    transition: { duration: 0.2 },
                  }}
                  onHoverStart={() => setHoveredCard(idx)}
                  onHoverEnd={() => setHoveredCard(null)}
                >
                  <Card
                    className={cn(
                      "relative overflow-hidden border-none bg-card/50 transition-all duration-300 h-full",
                      "hover:bg-card/80 transform hover:-translate-y-1 hover:shadow-lg",
                    )}
                  >
                    <motion.div
                      className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", feature.gradient)}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{
                        scale: hoveredCard === idx ? 1.1 : 1,
                        opacity: hoveredCard === idx ? 0.15 : 0.1,
                      }}
                      transition={{ duration: 0.6 }}
                    />
                    <CardHeader className="p-6">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{
                          scale: 1,
                          rotate: 0,
                          rotateY: hoveredCard === idx ? 360 : 0,
                        }}
                        transition={{
                          duration: 0.6,
                          delay: 0.1 * idx,
                          type: "spring",
                          stiffness: 200,
                          rotateY: { duration: 0.8 },
                        }}
                        className="mb-4"
                      >
                        <feature.icon className={cn("h-10 w-10", `text-gradient ${feature.gradient}`)} />
                      </motion.div>
                      <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-base text-muted-foreground p-6 pt-0">
                      {feature.description}
                    </CardContent>

                    {/* Animated highlight effect on hover */}
                    <motion.div
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${feature.gradient.split(" ")[1]}, ${feature.gradient.split(" ")[3]})`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: hoveredCard === idx ? "100%" : "0%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </Element>
  )
}

export default FeatureSections

