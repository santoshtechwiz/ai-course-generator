"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { useCallback, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Link as ScrollLink } from "react-scroll"
import Logo from "../shared/Logo"

const navItems = [
  { name: "Features", to: "features" },
  { name: "How It Works", to: "how-it-works" },
  { name: "Showcase", to: "showcase" },
  { name: "About", to: "about-us" },
  { name: "Testimonials", to: "testimonials" },
  { name: "FAQ", to: "faq" },
]

const navItemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
    },
  }),
}

interface NavbarProps {
  activeSection?: string
}

export default function Navbar({ activeSection = "" }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const navRef = useRef<HTMLDivElement>(null)

  // Scroll-based animations
  const { scrollY } = useScroll()
  const navBackground = useTransform(scrollY, [0, 100], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.9)"])
  const navBackgroundDark = useTransform(scrollY, [0, 100], ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.9)"])
  const navBlur = useTransform(scrollY, [0, 100], ["blur(0px)", "blur(10px)"])
  const navHeight = useTransform(scrollY, [0, 100], ["5rem", "4rem"])
  const navShadow = useTransform(scrollY, [0, 100], ["0 0 0 rgba(0,0,0,0)", "0 4px 20px rgba(0,0,0,0.1)"])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleGetStarted = useCallback(() => {
    router.push("/dashboard/explore")
  }, [router])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        style={{
          height: navHeight,
          boxShadow: navShadow,
          backdropFilter: navBlur,
          backgroundColor: isScrolled ? navBackground : "transparent",
        }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/10 w-full transition-all duration-300 bg-background/90 dark:bg-background/90"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>
        </motion.div>

        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item, index) => (
            <motion.div key={item.to} variants={navItemVariants} initial="hidden" animate="visible" custom={index}>
              <ScrollLink
                to={item.to}
                spy={true}
                smooth={true}
                offset={-64}
                duration={500}
                className={`text-base font-medium transition-colors relative group cursor-pointer
                  ${activeSection === item.to ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                activeClass="text-primary"
              >
                {item.name}
                <motion.span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-primary
                    ${activeSection === item.to ? "w-full" : "w-0"}`}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                />
              </ScrollLink>
            </motion.div>
          ))}
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              onClick={handleGetStarted}
              className="px-6 py-2 text-base font-medium relative overflow-hidden group rounded-full"
            >
              <motion.span
                className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 group-hover:w-full"
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
              />
              Get Started
            </Button>
          </motion.div>
        </div>

        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="rounded-full">
            <Menu className="w-6 h-6" />
          </Button>
        </motion.div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 w-72 bg-background/90 backdrop-blur-lg shadow-lg md:hidden dark:bg-background/90"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-4 border-b border-border/10">
                <Logo />
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" onClick={closeMobileMenu} className="rounded-full">
                    <X className="w-6 h-6" />
                  </Button>
                </motion.div>
              </div>
              <motion.div
                className="flex flex-col py-4"
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
                {navItems.map((item, index) => (
                  <motion.div key={item.to} variants={navItemVariants} custom={index}>
                    <ScrollLink
                      to={item.to}
                      spy={true}
                      smooth={true}
                      offset={-64}
                      duration={500}
                      className={`px-6 py-3 text-base font-medium hover:bg-accent/50 transition-colors cursor-pointer rounded-lg mx-2
                        ${activeSection === item.to ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                      activeClass="text-primary bg-accent/30"
                      onClick={closeMobileMenu}
                    >
                      {item.name}
                    </ScrollLink>
                  </motion.div>
                ))}
              </motion.div>
              <div className="mt-auto p-4 border-t border-border/10">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    className="w-full px-6 py-2 text-base font-medium rounded-full"
                    onClick={() => {
                      handleGetStarted()
                      closeMobileMenu()
                    }}
                  >
                    Get Started
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden dark:bg-background/80"
            onClick={closeMobileMenu}
          />
        )}
      </AnimatePresence>
    </>
  )
}
