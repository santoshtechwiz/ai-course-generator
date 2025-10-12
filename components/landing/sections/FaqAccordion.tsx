"use client"

import type React from "react"

import { useEffect } from "react"

import { useRef, useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { Plus, Minus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FeedbackButton } from "@/components/ui/feedback-button"
import { useDebounce } from "@/hooks"


// FAQ data
const faqs = [
	{
		id: "faq-1",
		question: "How does CourseAI work?",
		answer:
			"CourseAI uses AI to help you create educational content quickly. Enter a topic, and our AI generates course structures, quizzes, and learning materials. You can then customize and edit everything to match your teaching style.",
	},
	{
		id: "faq-2",
		question: "Can I create both courses and quizzes?",
		answer:
			"Yes! CourseAI supports multiple content types including full courses with chapters, multiple-choice quizzes, open-ended questions, fill-in-the-blanks, code challenges, and flashcards. Create what works best for your learners.",
	},
	{
		id: "faq-3",
		question: "Can I upload YouTube videos with transcripts?",
		answer:
			"Yes, you can add YouTube videos to your courses. If YouTube provides transcripts for the video, our AI can use them to generate relevant quizzes and summaries. Interactive elements depend on transcript availability.",
	},
	{
		id: "faq-4",
		question: "Is there a limit on how many learners I can invite?",
		answer:
			"The number of learners you can invite depends on your subscription plan. Free accounts have basic sharing capabilities, while paid plans offer expanded access and collaboration features. Check the pricing page for specific limits.",
	},
	{
		id: "faq-5",
		question: "How can I track learner progress?",
		answer:
			"CourseAI provides progress tracking for your courses and quizzes. Monitor completion rates, quiz scores, and time spent on content. Access analytics from your dashboard to see how learners engage with your materials.",
	},
	{
		id: "faq-6",
		question: "Can I edit AI-generated content?",
		answer:
			"Absolutely! All AI-generated content is fully editable. You have complete control to modify, add, or remove any part of your courses and quizzes. The AI serves as a starting point that you can refine to perfection.",
	},
	{
		id: "faq-7",
		question: "How do I share my courses?",
		answer:
			"You can share courses by generating a unique link or inviting learners via email. Set your courses as public, private, or password-protected based on your needs. Manage access controls from your dashboard.",
	},
	{
		id: "faq-8",
		question: "What types of quizzes can I create?",
		answer:
			"Create multiple quiz types: multiple-choice questions, open-ended questions, fill-in-the-blanks, code challenges, and flashcards. Each type supports AI generation and full customization to match your learning objectives.",
	},
	{
		id: "faq-9",
		question: "Is my content secure and private?",
		answer:
			"Yes. All your data is encrypted and stored securely. Your courses and quizzes are private by default—only you control who can access them. We follow industry-standard security practices to protect your content.",
	},
	{
		id: "faq-10",
		question: "Do I need technical skills to use CourseAI?",
		answer:
			"No technical skills required! CourseAI is designed to be simple and intuitive. Just provide a topic or content, and the AI handles the heavy lifting. The interface is user-friendly for educators, trainers, and anyone creating learning content.",
	},
]

// Apple-style easing
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

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
					Everything you need
					<br />
					<span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
						to know
					</span>
				</motion.h2>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ duration: 0.6, delay: 0.2, ease: APPLE_EASING }}
					className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
				>
					Get answers to the most common questions about CourseAI.
					We're here to help you create extraordinary learning experiences.
				</motion.p>
			</div>

			{/* Search with improved accessibility */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
				transition={{ duration: 0.6, delay: 0.3, ease: APPLE_EASING }}
				className="relative mb-10"
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
					{isSearching && (
							<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
								<span className="sr-only">Loading</span>
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
			>
				{filteredFaqs.length > 0 ? (
					filteredFaqs.map((faq, index) => (
						<motion.div
							key={faq.id}
							initial={{ opacity: 0, y: 20 }}
							animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
							transition={{ duration: 0.6, delay: 0.5 + index * 0.1, ease: APPLE_EASING }}
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
										onClickAsync={async () => {
											await new Promise((resolve) => setTimeout(resolve, 600))
											return true
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
						loadingText="Contacting support..."
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
