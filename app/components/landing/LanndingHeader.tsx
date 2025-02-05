"use client"

import * as React from "react"
import { Link as ScrollLink } from "react-scroll"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Logo from "../shared/Logo"
import { Menu, X } from 'lucide-react'

const navItems = [
  { name: "Features", to: "features" },
  { name: "How It Works", to: "how-it-works" },
  { name: "Showcase", to: "showcase" },
  { name: "About", to: "about" },
  { name: "FAQ", to: "faq" },
]

export default function LandingHeader() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleGetStarted = React.useCallback(() => {
    router.push("/dashboard")
  }, [router])

  const toggleMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev)
  }, [])

  const closeMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-300",
        isScrolled ? "bg-background/80 backdrop-blur-lg shadow-sm" : "bg-transparent",
      )}
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer">
          <ScrollLink
            to="hero"
            spy={true}
            smooth={true}
            offset={-64}
            duration={500}
            className="flex items-center space-x-2"
          >
            <span className="sr-only">Scroll to top</span>
          </ScrollLink>
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <ScrollLink
              key={item.to}
              to={item.to}
              spy={true}
              smooth={true}
              offset={-64}
              duration={500}
              className="text-sm font-medium text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200"
              activeClass="text-primary"
            >
              {item.name}
            </ScrollLink>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <Button onClick={handleGetStarted} className="hidden sm:inline-flex">
            Get Started
          </Button>
          <Button onClick={toggleMobileMenu} variant="ghost" size="icon" className="md:hidden">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background border-t"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              {navItems.map((item) => (
                <ScrollLink
                  key={item.to}
                  to={item.to}
                  spy={true}
                  smooth={true}
                  offset={-64}
                  duration={500}
                  className="text-sm font-medium text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200"
                  activeClass="text-primary"
                  onClick={closeMobileMenu}
                >
                  {item.name}
                </ScrollLink>
              ))}
              <Button onClick={handleGetStarted} className="w-full">
                Get Started
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
