"use client"

import type React from "react"

import { useEffect } from "react"

import { useRef, useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { Plus, Minus, Search } from "lucide-react"
import { GlobalLoader } from "@/components/ui/loader"
import { Input } from "@/components/ui/input"
import { FeedbackButton } from "@/components/ui/feedback-button"

// FAQ data
const faqs = [
  {
    id: "faq-1",
    question: "How does CourseAI generate content?",
    answer:
      "CourseAI uses AI to generate comprehensive, structured content tailored to your specific needs. It leverages advanced natural language processing and machine learning algorithms to analyze topics and create high-quality educational materials. The AI ensures that the content is accurate, engaging, and relevant to your audience.",
  },
  {
    id: "faq-2",
    question: "Can I edit the AI-generated content?",
    answer:
      "No, the AI-generated content cannot be edited directly. However, you can use the generated content as a reference or starting point to create your own customized materials outside the platform.",
  },
  {
    id: "faq-3",
    question: "Can I import existing content into CourseAI?",
    answer:
      "No, importing existing content is not supported at this time. CourseAI focuses on generating new content based on the topics you provide, ensuring originality and relevance.",
  },
  {
    id: "faq-4",
    question: "What happens if my course fails?",
    answer:
      "If your course fails, please contact our support team. We will review your case and return your token, allowing you to create a new course or make adjustments to improve your outcomes.",
  },
  {
    id: "faq-5",
    question: "Can I delete or make my course private?",
    answer:
      "Yes, you can delete your course or make it private. This ensures that you have full control over your content and can manage its visibility according to your preferences.",
  },
  {
    id: "faq-6",
    question: "Does CourseAI create videos?",
    answer:
      "No, CourseAI does not create videos. Instead, it fetches relevant videos from platforms like YouTube and other sources. This allows you to integrate high-quality video content into your courses without the need for video production.",
  },
  {
    id: "faq-7",
    question: "Can I share my course?",
    answer:
      "Yes, you can share your course with others. CourseAI provides sharing options to help you distribute your content to your intended audience effectively.",
  },
  {
    id: "faq-8",
    question: "Do videos have quizzes?",
    answer:
      "Yes, quizzes can be generated for videos if a transcript is available. If no transcript is provided, you can use our feature to create a quiz manually based on the video's topic. This ensures that your learners can test their understanding of the material.",
  },
  {
    id: "faq-9",
    question: "Can I see my progress?",
    answer:
      "Yes, you can track your progress through the platform. CourseAI provides detailed analytics and progress tracking features to help you monitor your learning journey and identify areas for improvement.",
  },
  {
    id: "faq-10",
    question: "Can I see my answers?",
    answer:
      "Only signed-in users can view their answers. This ensures that your data is secure and accessible only to you, providing a personalized learning experience.",
  },
]

// Apple-style easing function
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

const FaqAccordion = () => {
  const [openItem, setOpenItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })

  // Debounce search input
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Memoize filtered FAQs
  const filteredFaqs = useMemo(() => {
    if (!debouncedSearchQuery) return faqs

    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
    )
  }, [debouncedSearchQuery])

  const toggleItem = useCallback(async (id: string) => {
    setIsSearching(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    setOpenItem((prevOpenItem) => (prevOpenItem === id ? null : id))
    setIsSearching(false)
    return true
  }, [])

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSearching(true)
    setSearchQuery(e.target.value)
    setTimeout(() => setIsSearching(false), 500)
  }, [])

  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6" ref={containerRef}>
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: APPLE_EASING }}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          FAQ
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: APPLE_EASING }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Frequently asked questions
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: APPLE_EASING }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Find answers to common questions about CourseAI
        </motion.p>
      </div>

      {/* Search with improved accessibility */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.3, ease: APPLE_EASING }}
        className="relative mb-10"
        style={{ willChange: "transform, opacity" }}
      >
        <label htmlFor="faq-search" className="sr-only">
          Search questions
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5"
            aria-hidden="true"
          />
          <Input
            id="faq-search"
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10 py-6 rounded-full bg-card/30 backdrop-blur-sm border-border/10"
          />
          {isSearching && (            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <GlobalLoader size="xs" theme="primary" />
            </div>
          )}
        </div>
      </motion.div>

      {/* FAQ items */}
      <motion.div
        className="space-y-4"
        role="region"
        aria-label="Frequently Asked Questions"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: APPLE_EASING }}
        style={{ willChange: "transform, opacity" }}
      >
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.1, ease: APPLE_EASING }}
              style={{ willChange: "transform, opacity" }}
            >
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
                  <FeedbackButton
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/50 text-foreground"
                    aria-label={openItem === faq.id ? "Collapse answer" : "Expand answer"}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleItem(faq.id)
                    }}
                    onClickAsync={async (e) => {
                      e.stopPropagation()
                      return toggleItem(faq.id)
                    }}
                    variant="ghost"
                    size="icon"
                    showIcon={false}
                    feedbackDuration={300}
                  >
                    {openItem === faq.id ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </FeedbackButton>
                </div>

                <AnimatePresence>
                  {openItem === faq.id && (
                    <motion.div
                      id={`faq-answer-${faq.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: APPLE_EASING }}
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

      {/* Additional help section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.8, ease: APPLE_EASING }}
        className="mt-12 text-center"
      >
        <p className="text-muted-foreground">
          Still have questions?{" "}
          <FeedbackButton
            variant="link"
            className="text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-sm p-0"
            onClickAsync={async () => {
              await new Promise((resolve) => setTimeout(resolve, 800))
              window.location.href = "/contactus"
              return true
            }}
            loadingText="Loading..."
            successText="Opening contact page"
            showIcon={false}
          >
            Contact our support team
          </FeedbackButton>
        </p>
      </motion.div>
    </div>
  )
}

export default FaqAccordion
