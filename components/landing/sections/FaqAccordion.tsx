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
		question: "How does CourseAI create such amazing content?",
		answer:
			"CourseAI combines advanced AI with deep educational expertise to create comprehensive, engaging courses. Our system analyzes your topic, researches relevant information, and structures it into beautiful, interactive learning experiences that captivate and educate your audience.",
	},
	{
		id: "faq-2",
		question: "Can I customize the AI-generated content?",
		answer:
			"Absolutely! CourseAI gives you complete creative control. Edit any aspect of your course—from the content and structure to the visual design and quizzes. Our platform serves as your intelligent assistant, not a replacement for your expertise.",
	},
	{
		id: "faq-3",
		question: "Can I import my existing materials?",
		answer:
			"Yes! CourseAI supports importing content from various sources including PDFs, websites, YouTube videos, and existing documents. Our AI will intelligently restructure and enhance your materials into cohesive, engaging courses.",
	},
	{
		id: "faq-4",
		question: "What if I'm not satisfied with my course?",
		answer:
			"Your satisfaction is our priority. If you're not completely happy with your course, simply let us know within 30 days and we'll work with you to perfect it or provide a full refund. We stand behind the quality of our AI.",
	},
	{
		id: "faq-5",
		question: "How do I keep my courses private?",
		answer:
			"Privacy and control are built into CourseAI. You can set courses as private, password-protected, or share them only with specific individuals. Your content remains yours, and you have complete control over who can access it.",
	},
	{
		id: "faq-6",
		question: "Does CourseAI create video content?",
		answer:
			"CourseAI integrates seamlessly with video content. While we don't create videos ourselves, our platform automatically finds and incorporates relevant videos from YouTube and other sources, complete with interactive quizzes and discussion prompts.",
	},
	{
		id: "faq-7",
		question: "How do I share my courses with others?",
		answer:
			"Sharing is effortless with CourseAI. Generate a unique link, embed your course on websites, or share directly through email and social media. Track engagement and gather feedback from your audience with built-in analytics.",
	},
	{
		id: "faq-8",
		question: "Do videos include interactive elements?",
		answer:
			"Yes! CourseAI automatically generates quizzes, discussion questions, and interactive elements for video content. Even without transcripts, our AI creates relevant assessments that enhance learning and engagement.",
	},
	{
		id: "faq-9",
		question: "Can I track learner progress and engagement?",
		answer:
			"CourseAI provides comprehensive analytics and progress tracking. Monitor completion rates, quiz scores, time spent on content, and learner engagement. Use these insights to continuously improve your courses and teaching effectiveness.",
	},
	{
		id: "faq-10",
		question: "Is my data and progress secure?",
		answer:
			"Security is fundamental to CourseAI. All data is encrypted, and your personal information and course content are protected with enterprise-grade security. Only you can access your account and the courses you've created.",
	},
]

// Apple-style easing function
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
