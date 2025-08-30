"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ArrowRight, Menu, X, ArrowUp } from "lucide-react"
import { FeedbackButton } from "@/components/ui/feedback-button"
import AboutSection from "./sections/AboutSection"
import FaqAccordion from "./sections/FaqAccordion"
import FeatureShowcase from "./sections/FeatureShowcase"
import HowItWorksSection from "./sections/HowItWorksSection"
import ProductGallery from "./sections/ShowCase"
import TestimonialsSlider from "./sections/TestimonialsSlider"
import HeroSection from "./sections/HeroSection"

import { useRouter } from "next/navigation"
import { useMobile } from "@/hooks"

// Optimized Apple-style easing
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

// Simplified navigation items
const navItems = [
	{ id: "hero", label: "Home" },
	{ id: "features", label: "Features" },
	{ id: "showcase", label: "Showcase" },
	{ id: "about", label: "About" },
	{ id: "how-it-works", label: "How It Works" },
	{ id: "testimonials", label: "Testimonials" },
	{ id: "faq", label: "FAQ" },
]

const CourseAILandingPage = () => {
	const { theme } = useTheme()
	const isMobile = useMobile()
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [isLoaded, setIsLoaded] = useState(false)
	const router = useRouter()

	// Single ref for scroll container
	const containerRef = useRef<HTMLDivElement>(null)

	// Optimized scroll handling with throttling
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end end"],
	})

	// Simplified header transforms
	const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1])
	const headerY = useTransform(scrollYProgress, [0, 0.1], [-10, 0])

	// Client-side hydration
	useEffect(() => {
		setIsLoaded(true)
	}, [])

	// Optimized scroll to section
	const scrollToSection = useCallback(
		(sectionId: string) => {
			const element = document.getElementById(sectionId)
			if (element) {
				element.scrollIntoView({
					behavior: "smooth",
					block: "start",
				})
			}
			setIsMenuOpen(false)
		},
		[setIsMenuOpen],
	)

	// Simplified menu toggle
	const toggleMenu = useCallback(() => {
		setIsMenuOpen((prev) => !prev)
	}, [])

	// Prevent body scroll when menu is open
	useEffect(() => {
		if (isMenuOpen) {
			document.body.style.overflow = "hidden"
		} else {
			document.body.style.overflow = ""
		}
		return () => {
			document.body.style.overflow = ""
		}
	}, [isMenuOpen])

	// Loading state
	if (!isLoaded) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5, ease: APPLE_EASING }}
					className="text-center"
				>
					<div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
							className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
						/>
					</div>
					<p className="text-muted-foreground">Loading CourseAI...</p>
				</motion.div>
			</div>
		)
	}

	return (
		<div ref={containerRef} className="relative min-h-screen bg-background text-foreground">
			{/* Skip to main content */}
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
			>
				Skip to main content
			</a>

			{/* Header */}
			<motion.header
				className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 transition-all duration-300"
				style={{
					backgroundColor: theme === "dark" ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)",
					backdropFilter: "blur(20px)",
					WebkitBackdropFilter: "blur(20px)",
					y: headerY,
					opacity: headerOpacity,
				}}
				initial={{ y: -20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.6, ease: APPLE_EASING, delay: 0.2 }}
				role="banner"
			>
				{/* Logo */}
				<motion.div
					className="flex items-center"
					whileHover={{ scale: 1.02 }}
					transition={{ type: "spring", stiffness: 400, damping: 10 }}
				>
					<Link href="/" className="text-xl font-semibold" aria-label="CourseAI Home">
						<span className="text-primary font-bold">CourseAI</span>
					</Link>
				</motion.div>

				{/* Desktop Navigation */}
				<nav className="hidden md:flex items-center space-x-8" aria-label="Main navigation" role="navigation">
					{navItems.map((item) => (
						<motion.button
							key={item.id}
							onClick={() => scrollToSection(item.id)}
							className={cn(
								"text-sm font-medium transition-colors relative px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-primary/5",
								theme === "dark"
									? "text-white hover:text-white/90 hover:bg-white/5"
									: "text-gray-800 hover:text-gray-900 hover:bg-gray-50",
							)}
							whileHover={{
								scale: 1.03,
								transition: { duration: 0.2, ease: APPLE_EASING },
							}}
							whileTap={{ scale: 0.98 }}
						>
							{item.label}
						</motion.button>
					))}
				</nav>

				{/* CTA Button */}
				<div className="hidden md:block">
					<FeedbackButton
						className="rounded-full px-6 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
						loadingText="Redirecting..."
						successText="Redirecting..."
						onClickAsync={async () => {
							router.push("/dashboard/explore")
							return true
						}}
						aria-label="Get started with CourseAI"
					>
						Get Started
						<motion.span
							className="inline-block ml-2"
							initial={{ x: 0 }}
							whileHover={{ x: 3 }}
							transition={{ type: "spring", stiffness: 400, damping: 10 }}
							aria-hidden="true"
						>
							<ArrowRight className="h-4 w-4" />
						</motion.span>
					</FeedbackButton>
				</div>

				{/* Mobile Menu Button */}
				<motion.button
					onClick={toggleMenu}
					className="md:hidden text-foreground p-2 rounded-full hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-muted/50"
					aria-label={isMenuOpen ? "Close menu" : "Open menu"}
					aria-expanded={isMenuOpen}
					aria-controls="mobile-menu"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					transition={{ type: "spring", stiffness: 400, damping: 10 }}
				>
					<Menu className="h-6 w-6" aria-hidden="true" />
				</motion.button>
			</motion.header>

			{/* Mobile Menu */}
			<AnimatePresence>
				{isMenuOpen && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3, ease: APPLE_EASING }}
							className="fixed inset-0 bg-background/80 backdrop-blur-lg z-40"
							onClick={toggleMenu}
							aria-hidden="true"
						/>
						<motion.div
							id="mobile-menu"
							initial={{ x: "100%" }}
							animate={{ x: 0 }}
							exit={{ x: "100%" }}
							transition={{
								type: "spring",
								stiffness: 270,
								damping: 35,
								ease: APPLE_EASING,
							}}
							className="fixed top-0 right-0 bottom-0 w-80 bg-background/95 backdrop-blur-xl z-50 shadow-xl border-l border-border/10"
							role="dialog"
							aria-modal="true"
							aria-label="Mobile navigation menu"
						>
							<div className="flex justify-end p-4">
								<motion.button
									onClick={toggleMenu}
									className="p-2 rounded-full hover:bg-muted/50 transition-colors"
									aria-label="Close menu"
									whileHover={{ scale: 1.05, rotate: 90 }}
									whileTap={{ scale: 0.95 }}
									transition={{ type: "spring", stiffness: 400, damping: 10 }}
								>
									<X className="h-6 w-6" />
								</motion.button>
							</div>
							<nav className="flex flex-col p-4 space-y-4">
								{navItems.map((item, index) => (
									<motion.button
										key={item.id}
										onClick={() => scrollToSection(item.id)}
										className="text-left py-3 px-4 rounded-lg transition-colors text-foreground hover:bg-muted/50"
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{
											duration: 0.3,
											delay: 0.05 * index,
											ease: APPLE_EASING,
										}}
										whileHover={{
											x: 5,
											transition: { duration: 0.2, ease: APPLE_EASING },
										}}
										whileTap={{ scale: 0.98 }}
									>
										{item.label}
									</motion.button>
								))}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										duration: 0.3,
										delay: 0.4,
										ease: APPLE_EASING,
									}}
								>
									<FeedbackButton
										className="mt-4 w-full rounded-full"
										loadingText="Redirecting..."
										successText="Redirecting..."
										onClickAsync={async () => {
											router.push("/dashboard/explore")
											return true
										}}
									>
										Get Started
										<motion.span
											className="inline-block ml-2"
											initial={{ x: 0 }}
											whileHover={{ x: 3 }}
											transition={{ type: "spring", stiffness: 400, damping: 10 }}
										>
											<ArrowRight className="h-4 w-4" />
										</motion.span>
									</FeedbackButton>
								</motion.div>
							</nav>
						</motion.div>
					</>
				)}
			</AnimatePresence>

			<main id="main-content">
				{/* Hero Section */}
				<section id="hero" aria-labelledby="hero-heading">
					<HeroSection
						scrollToFeatures={() => scrollToSection("features")}
						scrollToHowItWorks={() => scrollToSection("how-it-works")}
						isHydrated={isLoaded}
					/>
				</section>

				{/* Features Section */}
				<motion.section
					id="features"
					className="py-20 md:py-32 relative"
					aria-labelledby="features-heading"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: APPLE_EASING }}
					viewport={{ once: true, amount: 0.1 }}
				>
					<FeatureShowcase />
				</motion.section>

				{/* Product Gallery Section */}
				<motion.section
					id="showcase"
					className="py-20 md:py-32 relative bg-muted/10"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: APPLE_EASING, delay: 0.1 }}
					viewport={{ once: true, amount: 0.1 }}
				>
					<ProductGallery />
				</motion.section>

				{/* About Us Section */}
				<motion.section
					id="about"
					className="py-20 md:py-32 relative"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: APPLE_EASING, delay: 0.2 }}
					viewport={{ once: true, amount: 0.1 }}
				>
					<AboutSection />
				</motion.section>

				{/* How It Works Section */}
				<motion.section
					id="how-it-works"
					className="py-20 md:py-32 relative"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: APPLE_EASING, delay: 0.3 }}
					viewport={{ once: true, amount: 0.1 }}
				>
					<HowItWorksSection />
				</motion.section>

				{/* Testimonials Section */}
				<motion.section
					id="testimonials"
					className="py-20 md:py-32 relative bg-muted/10"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: APPLE_EASING, delay: 0.4 }}
					viewport={{ once: true, amount: 0.1 }}
				>
					<TestimonialsSlider />
				</motion.section>

				{/* FAQ Section */}
				<motion.section
					id="faq"
					className="py-20 md:py-32 relative"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: APPLE_EASING, delay: 0.5 }}
					viewport={{ once: true, amount: 0.1 }}
				>
					<FaqAccordion />
				</motion.section>

				{/* CTA Section */}
				<motion.section
					id="cta"
					className="py-20 md:py-32 relative"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: APPLE_EASING, delay: 0.6 }}
					viewport={{ once: true, amount: 0.1 }}
				>
					<div className="container max-w-6xl mx-auto px-4 md:px-6">
						<div className="relative rounded-3xl overflow-hidden">
							<div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />

							<div className="relative p-8 md:p-16 text-center">
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, ease: APPLE_EASING }}
									viewport={{ once: true, amount: 0.2 }}
								>
									<h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
										Ready to transform
										<br />
										<span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
											how you create and share knowledge?
										</span>
									</h2>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: 0.1, ease: APPLE_EASING }}
									viewport={{ once: true, amount: 0.2 }}
								>
									<p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
										Join thousands of educators, trainers, and organizations who have
										revolutionized their content creation with CourseAI. Start your
										journey today and discover the future of learning.
									</p>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: 0.2, ease: APPLE_EASING }}
									viewport={{ once: true, amount: 0.2 }}
								>
									<FeedbackButton
										size="lg"
										className="px-8 py-6 text-lg rounded-full bg-primary hover:bg-primary/90 transition-all shadow-lg font-semibold"
										loadingText="Starting your journey..."
										successText="Welcome aboard!"
										errorText="Please try again"
										onClickAsync={async () => {
											await new Promise((resolve) => setTimeout(resolve, 800))
											router.push("/dashboard/create")
											return true
										}}
									>
										Start Your Free Trial
										<motion.span
											className="inline-block ml-2"
											initial={{ x: 0 }}
											whileHover={{ x: 3 }}
											transition={{ type: "spring", stiffness: 400, damping: 15 }}
										>
											<ArrowRight className="h-5 w-5" />
										</motion.span>
									</FeedbackButton>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: 0.3, ease: APPLE_EASING }}
									viewport={{ once: true, amount: 0.2 }}
									className="mt-10 flex flex-wrap items-center justify-center gap-4 md:gap-8"
								>
									<div className="flex items-center">
										<svg
											className="h-5 w-5 text-primary mr-2"
											viewBox="0 0 24 24"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M20 6L9 17L4 12"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
										<span className="text-sm">14-day free trial</span>
									</div>
									<div className="flex items-center">
										<svg
											className="h-5 w-5 text-primary mr-2"
											viewBox="0 0 24 24"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M20 6L9 17L4 12"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
										<span className="text-sm">No setup fees</span>
									</div>
									<div className="flex items-center">
										<svg
											className="h-5 w-5 text-primary mr-2"
											viewBox="0 0 24 24"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M20 6L9 17L4 12"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
										<span className="text-sm">Cancel anytime</span>
									</div>
								</motion.div>
							</div>
						</div>
					</div>
				</motion.section>
			</main>

			{/* Scroll to top button */}
			<AnimatePresence>
				<motion.button
					onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
					initial={{ opacity: 0, scale: 0.8, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.8, y: 20 }}
					transition={{ duration: 0.3, ease: APPLE_EASING }}
					className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg bg-primary hover:bg-primary/90 p-3 text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-all duration-200"
					aria-label="Scroll to top of page"
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.9 }}
				>
					<ArrowUp className="h-5 w-5" aria-hidden="true" />
				</motion.button>
			</AnimatePresence>
		</div>
	)
}

export default CourseAILandingPage
