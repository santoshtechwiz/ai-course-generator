"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { Plus, Minus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

// Update the FAQ questions to be more broadly appealing
const faqs = [
  {
    id: "faq-1",
    question: "How does CourseAI generate content?",
    answer:
      "CourseAI uses advanced natural language processing and machine learning algorithms to analyze your topic and generate comprehensive, structured content. It draws from a vast knowledge base to create accurate and engaging materials tailored to your specific needs.",
  },
  {
    id: "faq-2",
    question: "Can I edit the AI-generated content?",
    answer:
      "While CourseAI creates high-quality content, you have full control to edit, rearrange, or enhance any part of the generated materials. This allows you to add your personal touch and expertise to the content.",
  },
  {
    id: "faq-3",
    question: "What types of quizzes can CourseAI create?",
    answer:
      "CourseAI can generate multiple types of assessments including multiple-choice questions, true/false, fill-in-the-blanks, short answer questions, and even coding challenges for technical subjects. All quizzes are designed to effectively test comprehension and retention.",
  },
  {
    id: "faq-4",
    question: "Is CourseAI suitable for all subject matters?",
    answer:
      "Yes, CourseAI is designed to handle virtually any subject matter, from technical topics like programming and mathematics to humanities, languages, business, and creative fields. The AI adapts its approach based on the specific requirements of each subject.",
  },
  {
    id: "faq-5",
    question: "How much does CourseAI cost?",
    answer:
      "CourseAI offers flexible pricing plans to suit different needs. We have a free tier that allows you to create up to 3 pieces of content per month, and premium plans starting at $29/month for creators who need to produce more content. Enterprise plans are also available for organizations.",
  },
  {
    id: "faq-6",
    question: "Can I import existing content into CourseAI?",
    answer:
      "Yes, CourseAI allows you to import existing content in various formats including text documents, PDFs, and presentations. The AI can then enhance, reorganize, or expand upon this content to create more comprehensive materials.",
  },
  {
    id: "faq-7",
    question: "How does CourseAI handle updates to content?",
    answer:
      "CourseAI can automatically suggest updates to your content when new information becomes available in your field. You can review these suggestions and implement them with a single click, ensuring your materials always contain the most current information.",
  },
  {
    id: "faq-8",
    question: "Is my content private and secure?",
    answer:
      "Yes, we take privacy and security very seriously. All your content is encrypted and stored securely. We do not share your content with third parties, and you retain full ownership and control over all materials you create with CourseAI.",
  },
]

// Improve the FAQ accordion with Apple-style animations
const FaqAccordion = () => {
  const [openItem, setOpenItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleItem = (id: string) => {
    setOpenItem(openItem === id ? null : id)
  }

  // Apple-style animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    },
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6" ref={containerRef}>
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          FAQ
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Frequently asked questions
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Find answers to common questions about CourseAI
        </motion.p>
      </div>

      {/* Search with improved accessibility and Apple-style animations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative mb-10"
        style={{ willChange: "transform, opacity" }}
      >
        <label htmlFor="faq-search" className="sr-only">
          Search questions
        </label>
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5"
          aria-hidden="true"
        />
        <Input
          id="faq-search"
          type="text"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-6 rounded-full bg-card/30 backdrop-blur-sm border-border/10"
        />
      </motion.div>

      {/* FAQ items with Apple-style animations */}
      <motion.div
        className="space-y-4"
        role="region"
        aria-label="Frequently Asked Questions"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        style={{ willChange: "transform, opacity" }}
      >
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => (
            <motion.div key={faq.id} variants={itemVariants} style={{ willChange: "transform, opacity" }}>
              <div
                className="bg-card/30 backdrop-blur-sm rounded-xl border border-border/10 overflow-hidden"
                onClick={() => toggleItem(faq.id)}
              >
                <div
                  className="flex justify-between items-center p-6 cursor-pointer"
                  role="button"
                  aria-expanded={openItem === faq.id}
                  aria-controls={`faq-answer-${faq.id}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      toggleItem(faq.id)
                      e.preventDefault()
                    }
                  }}
                >
                  <h3 className="text-lg font-medium">{faq.question}</h3>
                  <motion.button
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/50 text-foreground"
                    aria-label={openItem === faq.id ? "Collapse answer" : "Expand answer"}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleItem(faq.id)
                    }}
                    whileHover={{
                      scale: 1.1,
                      backgroundColor: "rgba(var(--primary-rgb), 0.1)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    {openItem === faq.id ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {openItem === faq.id && (
                    <motion.div
                      id={`faq-answer-${faq.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <div className="px-6 pb-6 text-muted-foreground">{faq.answer}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <p className="text-muted-foreground">No matching questions found. Please try a different search term.</p>
          </motion.div>
        )}
      </motion.div>

      {/* Additional help section with Apple-style animations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="mt-12 text-center"
      >
        <p className="text-muted-foreground">
          Still have questions?{" "}
          <motion.a
            href="#"
            className="text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-sm"
            whileHover={{
              scale: 1.05,
              color: "hsl(var(--primary))",
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Contact our support team
          </motion.a>
        </p>
      </motion.div>
    </div>
  )
}

export default FaqAccordion
