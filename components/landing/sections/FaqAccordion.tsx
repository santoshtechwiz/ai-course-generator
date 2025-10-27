"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus } from "lucide-react"
import { FAQSkeleton } from "../skeletons"


// FAQ data
const faqs = [
	{
		id: "faq-1",
		question: "How does CourseAI work?",
		answer:
			"CourseAI automatically creates structured courses and intelligent quizzes using AI. You simply enter a course title or topic, and the AI uses the YouTube API to find relevant public videos, analyze available transcripts, and generate learning paths with quizzes. You can review everything before publishing.",
	},
	{
		id: "faq-2",
		question: "Do I have to provide YouTube links?",
		answer:
			"No, you don’t need to provide any YouTube links. CourseAI automatically searches and organizes public YouTube videos related to your topic. You can adjust the generated content before publishing, but after it’s published, the course becomes read-only.",
	},
	{
		id: "faq-3",
		question: "Can CourseAI generate quizzes from videos?",
		answer:
			"Yes. When videos have transcripts available, CourseAI uses those transcripts to automatically generate relevant quiz questions such as multiple-choice, coding, fill-in-the-blank, and open-ended types.",
	},
	{
		id: "faq-4",
		question: "What types of quizzes can I create?",
		answer:
			"CourseAI supports multiple quiz types including multiple-choice, coding challenges, fill-in-the-blank, and open-ended questions. The AI tailors quiz difficulty and style based on the analyzed video content.",
	},
	{
		id: "faq-5",
		question: "Who is CourseAI for?",
		answer:
			"CourseAI is designed for individuals and teams who want to build video-based learning paths and assessments using AI assistance. It’s a course and quiz creation tool, not a teaching marketplace or platform for educators.",
	},
	{
		id: "faq-6",
		question: "How do I track learner progress?",
		answer:
			"CourseAI includes built-in progress tracking for each course and quiz. You can view completion rates, quiz scores, and learner activity analytics to understand engagement and performance.",
	},
	{
		id: "faq-7",
		question: "Can I edit AI-generated content?",
		answer:
			"No, AI-generated courses and quizzes cannot be edited after publishing. You can review and make adjustments before publishing, but once a course is finalized, it becomes read-only to maintain integrity and consistency.",
	},
	{
		id: "faq-8",
		question: "How can I share my courses?",
		answer:
			"You can share your courses via unique links or by inviting learners through email. Courses can be public, private, or password-protected. Shared quizzes can be played externally, with results visible upon sign-in.",
	},
	{
		id: "faq-9",
		question: "Is my content secure and private?",
		answer:
			"Yes. Your courses and quizzes are private by default and only accessible to users you share them with. CourseAI follows modern security standards to protect your content and user data.",
	},
	{
		id: "faq-10",
		question: "Is CourseAI free or paid?",
		answer:
			"CourseAI offers free basic features to start with, along with premium plans for advanced analytics, more AI features, and higher usage limits. Pricing details will be announced soon.",
	},
];

// Apple-style easing
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

const FaqAccordion = () => {
	const [openItem, setOpenItem] = useState<string | null>(null)
	const toggleItem = (id: string) => {
		setOpenItem((prevOpenItem) => (prevOpenItem === id ? null : id))
	}

	return (
		<div className="w-full">
			<div className="text-center mb-16">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.2 }}
					transition={{ duration: 0.6, ease: APPLE_EASING }}
					className="inline-block px-3 py-1.5 rounded-sm border-4 border-[var(--color-border)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium mb-6"
				>
					FAQ
				</motion.div>

					<motion.h2
					id="faq-heading"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.2 }}
					transition={{ duration: 0.6, delay: 0.1, ease: APPLE_EASING }}
					className="text-3xl md:text-5xl font-black mb-6 max-w-4xl mx-auto"
				>
					Everything you need
					<br />
					<span className="text-[var(--color-bg)] drop-shadow-lg">
						to know
					</span>
				</motion.h2>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.2 }}
					transition={{ duration: 0.6, delay: 0.2, ease: APPLE_EASING }}
					className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
				>
					Get answers to the most common questions about CourseAI.
					We're here to help you create extraordinary learning experiences.
				</motion.p>
			</div>

			{/* FAQ Grid - Two Columns */}
			<motion.div
				className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto"
				role="region"
				aria-label="Frequently Asked Questions"
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				viewport={{ once: true, amount: 0.1 }}
				transition={{ duration: 0.6, delay: 0.3, ease: APPLE_EASING }}
			>
				{faqs.map((faq, index) => (
					<motion.div
						key={faq.id}
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, amount: 0.15 }}
						transition={{ duration: 0.5, delay: 0.4 + index * 0.05, ease: APPLE_EASING }}
						className="h-full"
					>
						<div
							className="bg-[var(--color-card)] rounded-2xl p-6 border-3 border-[var(--color-border)] shadow-[6px_6px_0px_0px_var(--color-border)] hover:shadow-[8px_8px_0px_0px_var(--color-border)] hover:translate-y-[-2px] transition-all duration-200 cursor-pointer h-full flex flex-col"
							onClick={() => toggleItem(faq.id)}
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
							<div className="flex justify-between items-start gap-4 mb-3">
								<h3 className="text-base font-bold text-foreground leading-tight flex-1">
									{faq.question}
								</h3>
								<motion.div
									animate={{ rotate: openItem === faq.id ? 180 : 0 }}
									transition={{ duration: 0.2, ease: APPLE_EASING }}
									className="flex-shrink-0 mt-1"
								>
									<div className="w-6 h-6 rounded-none bg-[var(--color-primary)]/10 border-2 border-[var(--color-primary)]/20 flex items-center justify-center">
										{openItem === faq.id ? (
											<Minus className="h-4 w-4 text-[var(--color-primary)]" />
										) : (
											<Plus className="h-4 w-4 text-[var(--color-primary)]" />
										)}
									</div>
								</motion.div>
							</div>

							{/* Answer - Animated Expand */}
							<AnimatePresence initial={false}>
								{openItem === faq.id && (
									<motion.div
										initial={{ opacity: 0, height: 0, marginTop: 0 }}
										animate={{ opacity: 1, height: "auto", marginTop: 12 }}
										exit={{ opacity: 0, height: 0, marginTop: 0 }}
										transition={{ duration: 0.3, ease: APPLE_EASING }}
										id={`faq-answer-${faq.id}`}
									>
										<div className="text-sm leading-relaxed font-medium text-muted-foreground">
											{faq.answer}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</motion.div>
				))}
			</motion.div>

			{/* Additional help section */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true, amount: 0.2 }}
				transition={{ duration: 0.6, delay: 0.8, ease: APPLE_EASING }}
				className="mt-12 text-center"
			>
				<p className="text-muted-foreground">
					Still have questions?{" "}
					<a
						href="/contactus"
						className="text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-sm p-0"
					>
						Contact our support team
					</a>
				</p>
			</motion.div>
		</div>
	)
}

export default FaqAccordion
