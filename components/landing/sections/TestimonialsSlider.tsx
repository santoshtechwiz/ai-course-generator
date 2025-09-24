"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Apple-style easing function
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

// Testimonial data
const testimonials = [
	{
		quote:
			"CourseAI has revolutionized my content creation workflow. What once took me days of research and writing now happens in minutes, and the results are incredibly professional and engaging. It's like having a team of expert educators at my fingertips.",
		author: "Sarah Johnson",
		role: "Digital Learning Designer",
		avatar: "/placeholder.svg?height=100&width=100&text=SJ",
		id: "testimonial-1",
	},
	{
		quote:
			"The quality of AI-generated content from CourseAI is astonishing. It doesn't just create generic material—it understands context, audience, and learning objectives. My users' engagement has increased by 300% since I started using it.",
		author: "Dr. Michael Chen",
		role: "University Professor",
		avatar: "/placeholder.svg?height=100&width=100&text=MC",
		id: "testimonial-2",
	},
	{
		quote:
			"As someone who creates corporate training programs, I need tools that deliver results. CourseAI doesn't just save time—it creates better learning experiences. Our completion rates have doubled, and feedback scores are through the roof.",
		author: "Emily Rodriguez",
		role: "Corporate Training Director",
		avatar: "/placeholder.svg?height=100&width=100&text=ER",
		id: "testimonial-3",
	},
	{
		quote:
			"I was amazed at how CourseAI captured my teaching style and voice. The AI doesn't replace the human element—it enhances it. Now I can focus on mentoring users rather than creating content from scratch.",
		author: "David Kim",
		role: "High School Teacher",
		avatar: "/placeholder.svg?height=100&width=100&text=DK",
		id: "testimonial-4",
	},
]

const TestimonialsSlider = () => {
	const [activeIndex, setActiveIndex] = useState(0)
	const containerRef = useRef<HTMLDivElement>(null)
	const isInView = useInView(containerRef, { once: true, amount: 0.2 })

	// Navigation functions
	const nextTestimonial = useCallback(() => {
		setActiveIndex((prev) => (prev + 1) % testimonials.length)
	}, [])

	const prevTestimonial = useCallback(() => {
		setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
	}, [])

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowRight") {
				nextTestimonial()
			} else if (e.key === "ArrowLeft") {
				prevTestimonial()
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [nextTestimonial, prevTestimonial])

	// Auto-advance testimonials with pause on hover
	const [isPaused, setIsPaused] = useState(false)

	useEffect(() => {
		if (isPaused) return

		const interval = setInterval(() => {
			nextTestimonial()
		}, 6000)

		return () => clearInterval(interval)
	}, [isPaused, nextTestimonial])

	return (
		<div className="py-24 bg-gray-50 dark:bg-gray-800/50">
			<div
				className="container max-w-6xl mx-auto px-4 md:px-6"
				ref={containerRef}
				onMouseEnter={() => setIsPaused(true)}
				onMouseLeave={() => setIsPaused(false)}
			>
				{/* Header - More like n8n */}
				<motion.div
					className="text-center mb-16"
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ duration: 0.6, ease: APPLE_EASING }}
				>
					<h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
						Trusted by educators worldwide
					</h2>
					<p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
						See how CourseAI is transforming education for teachers, trainers, and organizations.
					</p>
				</motion.div>

			<div className="relative max-w-4xl mx-auto">
				{/* Navigation buttons with Apple-style animations */}
				<div className="absolute top-1/2 -left-4 md:-left-12 transform -translate-y-1/2 z-10">
					<motion.div
						whileHover={{ scale: 1.1, x: -3 }}
						whileTap={{ scale: 0.95 }}
						transition={{ duration: 0.2, ease: APPLE_EASING }}
					>
						<Button
							variant="outline"
							size="icon"
							className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
							onClick={prevTestimonial}
							aria-label="Previous testimonial"
						>
							<ChevronLeft className="h-5 w-5" />
						</Button>
					</motion.div>
				</div>

				<div className="absolute top-1/2 -right-4 md:-right-12 transform -translate-y-1/2 z-10">
					<motion.div
						whileHover={{ scale: 1.1, x: 3 }}
						whileTap={{ scale: 0.95 }}
						transition={{ duration: 0.2, ease: APPLE_EASING }}
					>
						<Button
							variant="outline"
							size="icon"
							className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
							onClick={nextTestimonial}
							aria-label="Next testimonial"
						>
							<ChevronRight className="h-5 w-5" />
						</Button>
					</motion.div>
				</div>

				{/* Testimonials carousel with Apple-style animations */}
				<div
					className="overflow-hidden"
					role="region"
					aria-roledescription="carousel"
					aria-label="Testimonials carousel"
					style={{ perspective: "1000px" }}
				>
					<motion.div
						className="flex"
						animate={{
							x: `-${activeIndex * 100}%`,
							transition: {
								type: "spring",
								stiffness: 300,
								damping: 30,
								ease: APPLE_EASING,
							},
						}}
						style={{ willChange: "transform" }}
					>
						{testimonials.map((testimonial, index) => (
							<div
								key={testimonial.id}
								className="min-w-full"
								role="group"
								aria-roledescription="slide"
								aria-label={`Testimonial ${index + 1} of ${testimonials.length}`}
								aria-hidden={activeIndex !== index}
							>
								<AnimatePresence mode="wait">
									{activeIndex === index && (
										<motion.div
											initial={{ opacity: 0, y: 30, rotateX: 10 }}
											animate={{ opacity: 1, y: 0, rotateX: 0 }}
											exit={{ opacity: 0, y: -30, rotateX: -10 }}
											transition={{ duration: 0.7, ease: APPLE_EASING }}
											className="bg-card/30 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-border/10 shadow-lg text-center"
											style={{
												transformPerspective: "1200px",
												willChange: "transform, opacity",
											}}
										>
											<motion.div
												initial={{ scale: 0, opacity: 0 }}
												animate={{ scale: 1, opacity: 0.3 }}
												transition={{ duration: 0.7, delay: 0.2, ease: APPLE_EASING }}
											>
												{/* <Quote className="h-14 w-14 text-primary/30 mx-auto mb-6" aria-hidden="true" /> */}
											</motion.div>

											<motion.p
												className="text-xl md:text-2xl italic mb-8 leading-relaxed"
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.7, delay: 0.3, ease: APPLE_EASING }}
											>
												{testimonial.quote}
											</motion.p>

											<motion.div
												className="flex items-center justify-center"
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.7, delay: 0.4, ease: APPLE_EASING }}
											>
												<motion.div
													whileHover={{ scale: 1.1, y: -2 }}
													transition={{ duration: 0.3, ease: APPLE_EASING }}
												>
													<Avatar className="h-16 w-16 mr-4 border-2 border-primary/10 shadow-lg">
														<AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.author} />
														<AvatarFallback>
															{testimonial.author
																.split(" ")
																.map((n) => n[0])
																.join("")}
														</AvatarFallback>
													</Avatar>
												</motion.div>
												<div className="text-left">
													<div className="font-semibold text-lg">{testimonial.author}</div>
													<div className="text-sm text-muted-foreground">{testimonial.role}</div>
												</div>
											</motion.div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						))}
					</motion.div>
				</div>

				{/* Dots indicator with Apple-style animations */}
				<div className="flex justify-center mt-8 space-x-3" role="tablist" aria-label="Testimonial navigation">
					{testimonials.map((_, index) => (
						<motion.button
							key={index}
							className={`w-3 h-3 rounded-full transition-colors ${index === activeIndex ? "bg-primary" : "bg-muted"}`}
							onClick={() => setActiveIndex(index)}
							aria-label={`Go to testimonial ${index + 1}`}
							aria-selected={index === activeIndex}
							role="tab"
							whileHover={{ scale: 1.6 }}
							whileTap={{ scale: 0.9 }}
							transition={{ duration: 0.3, ease: APPLE_EASING }}
						/>
					))}
				</div>
				</div>
			</div>
		</div>
	)
}

export default TestimonialsSlider
