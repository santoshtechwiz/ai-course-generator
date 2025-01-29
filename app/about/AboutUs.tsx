"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RocketIcon, BrainCircuitIcon, UsersIcon, SparklesIcon } from "lucide-react"
import { motion } from "framer-motion"

const sections = [
  {
    title: "Our Mission",
    description:
      "At CourseAI, we aim to simplify course creation by leveraging the power of AI. Our mission is to empower educators and learners worldwide with seamless tools to share knowledge.",
    icon: RocketIcon,
    color: "bg-blue-500",
  },
  {
    title: "Our Vision",
    description:
      "Our vision is to create a world where learning is accessible, affordable, and engaging for everyone. We aspire to become the go-to platform for personalized and interactive learning, helping individuals unlock their potential and achieve their goals through innovative AI-driven solutions.",
    icon: BrainCircuitIcon,
    color: "bg-green-500",
  },
  {
    title: "Meet the Founder",
    description:
      "Hi, I'm a seasoned software developer with 13 years of experience. I've always been passionate about learning new things, but I often found online courses to be very costly. This inspired me to create a platform where anyone can instantly generate quizzes on any topic to check their knowledge.",
    icon: UsersIcon,
    color: "bg-purple-500",
  },
  {
    title: "Future Plans",
    description:
      "We're constantly innovating to improve CourseAI. Our future plans include expanding AI capabilities for more interactive courses, introducing new subscription tiers with premium features, and building a thriving community of educators and learners.",
    icon: SparklesIcon,
    color: "bg-orange-500",
  },
]

const AboutUs = () => {
  return (
    <section className="py-12 px-4 max-w-5xl mx-auto space-y-12">
      

      <motion.div
        className="grid gap-8 md:grid-cols-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${section.color} bg-opacity-20`}>
                    <section.icon className={`w-6 h-6 ${section.color.replace("bg-", "text-")}`} />
                  </div>
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                </div>
                <p className="text-muted-foreground">{section.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Button size="lg" className="px-8 py-3 text-lg" onClick={() => window.location.href = "/contactus"}>
          Get in Touch
        </Button>
      </motion.div>
    </section>
  )
}

export default AboutUs

