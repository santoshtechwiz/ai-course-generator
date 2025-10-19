"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TestimonialsSkeleton } from "../skeletons"
import { cn } from "@/lib/utils"

// Apple-style easing function
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

// Testimonial data
const testimonials = [
	{
		quote:
			"CourseAI makes it easy to create courses with YouTube videos. I can organize them into chapters and the progress tracking helps me understand how my learners are doing.",
		author: "Alex Rivera",
		role: "Content Creator",
		avatar: "/api/placeholder?height=100&width=100&text=AR",
		alt: "Portrait of Alex Rivera, Content Creator",
		id: "testimonial-1",
	},
	{
		quote:
			"The AI quiz generation from transcripts is a game-changer. I can quickly create assessments that match my video content without spending hours writing questions manually.",
		author: "Jordan Lee",
		role: "Online Instructor",
		avatar: "/api/placeholder?height=100&width=100&text=JL",
		alt: "Portrait of Jordan Lee, Online Instructor",
		id: "testimonial-2",
	},
	{
		quote:
			"I love how CourseAI helps me build learning paths with my existing videos. The chapter organization and sharing features make it perfect for team training programs.",
		author: "Taylor Morgan",
		role: "Team Lead",
		avatar: "/api/placeholder?height=100&width=100&text=TM",
		alt: "Portrait of Taylor Morgan, Team Lead",
		id: "testimonial-3",
	},
	{
		quote:
			"The progress tracking and analytics give me great insights into learner engagement. CourseAI helps me understand what's working and improve my courses.",
		author: "Casey Park",
		role: "Learning Coordinator",
		avatar: "/api/placeholder?height=100&width=100&text=CP",
		alt: "Portrait of Casey Park, Learning Coordinator",
		id: "testimonial-4",
	},
]

const TestimonialsSlider = () => {
	const [activeIndex, setActiveIndex] = useState(0)
	const containerRef = useRef<HTMLDivElement>(null)
	const isInView = useInView(containerRef, { once: true, amount: 0.2 })
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		// Simulate loading time for better UX
		const timer = setTimeout(() => setIsLoading(false), 100)
		return () => clearTimeout(timer)
	}, [])

	// Check for reduced motion preference
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
		setPrefersReducedMotion(mediaQuery.matches)

		const handleChange = (e: MediaQueryListEvent) => {
			setPrefersReducedMotion(e.matches)
		}

		mediaQuery.addEventListener('change', handleChange)
		return () => mediaQuery.removeEventListener('change', handleChange)
	}, [])

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
			// Only handle keyboard navigation when testimonials section is in view
			if (!isInView) return

			if (e.key === "ArrowRight") {
				e.preventDefault()
				nextTestimonial()
			} else if (e.key === "ArrowLeft") {
				e.preventDefault()
				prevTestimonial()
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [nextTestimonial, prevTestimonial, isInView])

	// Auto-advance testimonials with pause on hover
	const [isPaused, setIsPaused] = useState(false)

	useEffect(() => {
		if (isPaused || prefersReducedMotion) return

		const interval = setInterval(() => {
			nextTestimonial()
		}, 6000)

		return () => clearInterval(interval)
	}, [isPaused, nextTestimonial, prefersReducedMotion])

	// Early return for loading state - AFTER all hooks
	if (isLoading) {
		return <TestimonialsSkeleton />
	}

	return (
		<div className="py-16 md:py-24 bg-background">
			<div
				className="w-full"
				ref={containerRef}
				onMouseEnter={() => setIsPaused(true)}
				onMouseLeave={() => setIsPaused(false)}
				role="region"
				aria-label="Customer testimonials"
				aria-live="polite"
			>
				{/* Header */}
				<motion.div
					className="text-center mb-16"
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ duration: 0.6, ease: APPLE_EASING }}
				>
					<h2 id="testimonials-heading" className="text-4xl md:text-6xl font-black text-foreground mb-6">
						What our users say
					</h2>
					<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
						Discover how CourseAI helps creators build better learning experiences.
					</p>
				</motion.div>

				<div className="relative max-w-6xl mx-auto px-4">
					{/* Navigation buttons */}
					<div className="absolute top-1/2 -left-4 md:-left-8 transform -translate-y-1/2 z-10">
						<motion.div
							whileHover={{ scale: 1.1, x: -2 }}
							whileTap={{ scale: 0.95 }}
							transition={{ duration: 0.2, ease: APPLE_EASING }}
						>
							<Button
								variant="outline"
								size="icon"
								className="rounded-xl bg-background border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))] hover:translate-y-[-2px] transition-all duration-200 h-12 w-12"
								onClick={prevTestimonial}
								aria-label="Previous testimonial"
							>
								<ChevronLeft className="h-6 w-6" />
							</Button>
						</motion.div>
					</div>

					<div className="absolute top-1/2 -right-4 md:-right-8 transform -translate-y-1/2 z-10">
						<motion.div
							whileHover={{ scale: 1.1, x: 2 }}
							whileTap={{ scale: 0.95 }}
							transition={{ duration: 0.2, ease: APPLE_EASING }}
						>
							<Button
								variant="outline"
								size="icon"
								className="rounded-xl bg-background border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))] hover:translate-y-[-2px] transition-all duration-200 h-12 w-12"
								onClick={nextTestimonial}
								aria-label="Next testimonial"
							>
								<ChevronRight className="h-6 w-6" />
							</Button>
						</motion.div>
					</div>

					{/* Testimonials carousel */}
					<div
						className="overflow-hidden"
						role="region"
						aria-roledescription="carousel"
						aria-label="Testimonials carousel"
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
									className="min-w-full px-4"
									role="group"
									aria-roledescription="slide"
									aria-label={`Testimonial ${index + 1} of ${testimonials.length}`}
									aria-hidden={activeIndex !== index}
								>
									<AnimatePresence mode="wait">
										{activeIndex === index && (
											<motion.div
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -20 }}
												transition={{ duration: 0.5, ease: APPLE_EASING }}
												className="bg-card rounded-3xl p-8 md:p-12 border-3 border-border shadow-[8px_8px_0px_0px_hsl(var(--border))] text-center"
											>
												{/* Quote Icon */}
												<motion.div
													initial={{ scale: 0, opacity: 0 }}
													animate={{ scale: 1, opacity: 1 }}
													transition={{ duration: 0.5, delay: 0.1, ease: APPLE_EASING }}
													className="flex justify-center mb-8"
												>
													<div className="p-4 rounded-2xl bg-primary/10 border-3 border-primary/20">
														<Quote className="h-8 w-8 text-primary" aria-hidden="true" />
													</div>
												</motion.div>

												{/* Testimonial Text */}
												<motion.p
													className="text-xl md:text-2xl leading-relaxed mb-8 font-medium max-w-4xl mx-auto"
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ duration: 0.5, delay: 0.2, ease: APPLE_EASING }}
												>
													"{testimonial.quote}"
												</motion.p>

												{/* Author Info */}
												<motion.div
													className="flex flex-col sm:flex-row items-center justify-center gap-4"
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ duration: 0.5, delay: 0.3, ease: APPLE_EASING }}
												>
													<motion.div
														whileHover={{ scale: 1.05, y: -2 }}
														transition={{ duration: 0.2, ease: APPLE_EASING }}
													>
														<Avatar className="h-20 w-20 border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))]">
															<AvatarImage 
																src={testimonial.avatar || "/api/placeholder"} 
																alt={testimonial.alt || testimonial.author} 
															/>
															<AvatarFallback className="text-lg font-black bg-primary/10 text-primary">
																{testimonial.author
																	.split(" ")
																	.map((n) => n[0])
																	.join("")}
															</AvatarFallback>
														</Avatar>
													</motion.div>
													<div className="text-center sm:text-left">
														<div className="font-black text-xl text-foreground">{testimonial.author}</div>
														<div className="text-muted-foreground font-medium">{testimonial.role}</div>
													</div>
												</motion.div>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							))}
						</motion.div>
					</div>

					{/* Dots indicator */}
					<div className="flex justify-center mt-12 gap-3" role="tablist" aria-label="Testimonial navigation">
						{testimonials.map((_, index) => (
							<motion.button
								key={index}
								className={cn(
									"w-4 h-4 rounded-xl border-3 transition-all duration-300",
									index === activeIndex 
										? "bg-primary border-primary shadow-[2px_2px_0px_0px_hsl(var(--primary))]" 
										: "bg-muted border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:bg-primary/50"
								)}
								onClick={() => setActiveIndex(index)}
								aria-label={`Go to testimonial ${index + 1}`}
								aria-selected={index === activeIndex}
								role="tab"
								whileHover={{ scale: 1.3 }}
								whileTap={{ scale: 0.9 }}
								transition={{ duration: 0.2, ease: APPLE_EASING }}
							/>
						))}
					</div>

					{/* Progress indicator */}
					<div className="flex justify-center mt-8">
						<div className="px-6 py-3 rounded-2xl bg-card border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))]">
							<span className="text-sm font-black text-foreground">
								{activeIndex + 1} / {testimonials.length}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default TestimonialsSlider