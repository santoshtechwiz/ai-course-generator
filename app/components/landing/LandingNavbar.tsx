"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Link as ScrollLink } from "react-scroll"
import Logo from "../shared/Logo"
import { signIn } from "next-auth/react"

const navItems = [
  { name: "Features", to: "features" },
  { name: "How It Works", to: "how-it-works" },
  { name: "Showcase", to: "showcase" },
  { name: "About", to: "about-us" },
  { name: "Testimonials", to: "testimonials" },
  { name: "FAQ", to: "faq" },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
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
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-sm border-b border-border w-full ${
          isScrolled ? "bg-background/80" : "bg-transparent"
        }`}
      >
        <Link href="/" className="flex items-center space-x-2">
          <Logo />
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <ScrollLink
              key={item.to}
              to={item.to}
              spy={true}
              smooth={true}
              offset={-64}
              duration={500}
              className="text-muted-foreground hover:text-foreground transition-colors relative group cursor-pointer"
              activeClass="text-primary"
            >
              {item.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </ScrollLink>
          ))}
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <Button variant="ghost" onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}>
            Sign In
          </Button>
          <Button onClick={handleGetStarted}>Get Started</Button>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMobileMenu}>
          <Menu className="w-6 h-6" />
        </Button>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween" }}
            className="fixed inset-y-0 right-0 z-50 w-64 bg-background shadow-lg md:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-4 border-b border-border">
                <Logo />
                <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <div className="flex flex-col py-4">
                {navItems.map((item) => (
                  <ScrollLink
                    key={item.to}
                    to={item.to}
                    spy={true}
                    smooth={true}
                    offset={-64}
                    duration={500}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                    activeClass="text-primary"
                    onClick={closeMobileMenu}
                  >
                    {item.name}
                  </ScrollLink>
                ))}
              </div>
              <div className="mt-auto p-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full mb-2"
                  onClick={() => {
                    signIn(undefined, { callbackUrl: "/dashboard" })
                    closeMobileMenu()
                  }}
                >
                  Sign In
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    handleGetStarted()
                    closeMobileMenu()
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" onClick={closeMobileMenu} />
      )}
    </>
  )
}

