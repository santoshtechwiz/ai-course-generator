import type React from "react"
import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo-utils"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Code, BookOpen, Zap, Users, Award, CheckCircle } from "lucide-react"
import FaqSchema from "@/app/schema/faq-schema"

export const metadata: Metadata = generatePageMetadata({
  title: "About CourseAI | AI-Powered Coding Education Platform",
  description:
    "Learn how CourseAI is revolutionizing programming education with AI-generated quizzes, flashcards, and interactive learning tools for developers of all levels.",
  path: "/about",
  keywords: [
    "about courseai",
    "ai coding education",
    "programming learning platform",
    "ai quiz generator",
    "coding education technology",
    "developer learning tools",
    "programming assessment platform",
    "ai for coding teachers",
    "tech education innovation",
  ],
  ogImage: "/api/og?title=About+CourseAI&description=AI-Powered+Coding+Education+Platform",
})

const AboutUs = () => {
  const faqs = [
    {
      question: "What is CourseAI?",
      answer:
        "CourseAI is an AI-powered platform that generates high-quality coding questions, quizzes, and flashcards to help developers learn programming concepts more effectively. Our platform uses advanced AI to create personalized learning experiences.",
    },
    {
      question: "How does CourseAI generate coding questions?",
      answer:
        "CourseAI uses advanced natural language processing and machine learning algorithms to analyze programming concepts and generate relevant, challenging questions that test understanding rather than just memorization.",
    },
    {
      question: "Is CourseAI suitable for beginners?",
      answer:
        "Yes! CourseAI adapts to all skill levels, from beginners to advanced developers. Our platform can generate questions appropriate for your current knowledge level and gradually increase difficulty as you progress.",
    },
    {
      question: "What programming languages does CourseAI support?",
      answer:
        "CourseAI supports all major programming languages including JavaScript, Python, Java, C++, Ruby, Go, TypeScript, PHP, and many more. We're constantly expanding our language support.",
    },
    {
      question: "Can educators use CourseAI for teaching?",
      answer:
        "CourseAI is designed with educators in mind. Teachers can create custom quizzes, track student progress, and generate assessment materials quickly and easily.",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Revolutionizing Programming Education with AI</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          CourseAI is transforming how developers learn and practice coding through AI-generated questions, interactive
          quizzes, and personalized learning paths.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Try CourseAI Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/contactus">Contact Us</Link>
          </Button>
        </div>
      </section>

      {/* Mission Section */}
      <section className="grid md:grid-cols-2 gap-12 items-center mb-20">
        <div>
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg text-muted-foreground mb-6">
            We believe that learning to code should be engaging, effective, and accessible to everyone. Our mission is
            to leverage the power of AI to create personalized learning experiences that help developers master
            programming concepts faster and more thoroughly.
          </p>
          <p className="text-lg text-muted-foreground">
            By generating high-quality coding questions and interactive learning materials, we're helping both
            individual learners and educators save time while achieving better results.
          </p>
        </div>
        <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden">
          <Image
            src="/placeholder.svg?height=400&width=600"
            alt="CourseAI Mission Visualization"
            fill
            className="object-cover"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">How CourseAI Transforms Learning</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Code className="h-8 w-8" />}
            title="AI-Generated Questions"
            description="Our AI creates high-quality coding questions that test understanding, not just memorization."
          />
          <FeatureCard
            icon={<BookOpen className="h-8 w-8" />}
            title="Interactive Flashcards"
            description="Master programming concepts with spaced repetition and active recall techniques."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Personalized Learning"
            description="Adaptive difficulty ensures you're always challenged at the right level."
          />
          <FeatureCard
            icon={<Users className="h-8 w-8" />}
            title="Educator Tools"
            description="Create custom assessments and track student progress with powerful analytics."
          />
          <FeatureCard
            icon={<Award className="h-8 w-8" />}
            title="Skill Certification"
            description="Validate your programming knowledge with comprehensive skill assessments."
          />
          <FeatureCard
            icon={<CheckCircle className="h-8 w-8" />}
            title="Continuous Improvement"
            description="Our AI learns from user interactions to constantly improve question quality."
          />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <TestimonialCard
            quote="CourseAI has completely transformed how I prepare my students for technical interviews. The quality of the generated questions is outstanding."
            author="Sarah Johnson"
            role="Computer Science Professor"
          />
          <TestimonialCard
            quote="I've tried many coding practice platforms, but CourseAI's personalized approach has helped me improve faster than anything else."
            author="Michael Chen"
            role="Full Stack Developer"
          />
          <TestimonialCard
            quote="As a bootcamp instructor, CourseAI saves me hours of preparation time while providing my students with better practice materials."
            author="David Rodriguez"
            role="Coding Bootcamp Instructor"
          />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center bg-muted p-12 rounded-xl">
        <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Coding Education?</h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Join thousands of developers and educators who are already using CourseAI to create better learning
          experiences.
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard">
            Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Schema.org FAQ markup */}
      <FaqSchema faqs={faqs} />
    </div>
  )
}

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="border border-border rounded-xl p-6 transition-all hover:shadow-md">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

const TestimonialCard = ({ quote, author, role }: { quote: string; author: string; role: string }) => {
  return (
    <div className="border border-border rounded-xl p-6 transition-all hover:shadow-md">
      <p className="italic mb-4">"{quote}"</p>
      <div>
        <p className="font-semibold">{author}</p>
        <p className="text-sm text-muted-foreground">{role}</p>
      </div>
    </div>
  )
}

export default AboutUs

