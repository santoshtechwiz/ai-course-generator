"use client"

import { useRef, useEffect } from "react"
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

const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
}

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const FeatureSections = ({ featuresRef, controls }: { featuresRef: React.MutableRefObject<null>, controls: any }) => {

  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })


  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  return (
    <Element name="features">
      <section ref={sectionRef} className="py-20 px-4 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial="hidden" animate={controls} variants={stagger} className="space-y-12">
            <motion.div variants={fadeInUp} className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-foreground">Empower Your Course Creation</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Transform YouTube videos into comprehensive courses with CourseAI's powerful features
              </p>
            </motion.div>

            <motion.div variants={stagger} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, idx) => (
                <motion.div key={idx} variants={fadeInUp} custom={idx}>
                  <Card className="relative overflow-hidden border-none bg-card/50 hover:bg-card/80 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg h-full">
                    <motion.div
                      className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", feature.gradient)}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    />
                    <CardHeader>
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
                      >
                        <feature.icon className={cn("h-8 w-8 mb-2", `text-gradient ${feature.gradient}`)} />
                      </motion.div>
                      <CardTitle className="text-foreground">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">{feature.description}</CardContent>
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

export default FeatureSections;