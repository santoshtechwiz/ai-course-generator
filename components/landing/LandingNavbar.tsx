"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
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
      ease: "easeOut",
    },
  }),
}

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
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 backdrop-blur-sm border-b border-border w-full ${
          isScrolled ? "bg-background/90" : "bg-transparent"
        }`}
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors relative group cursor-pointer"
                activeClass="text-primary"
              >
                {item.name}
                <motion.span
                  className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary"
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </ScrollLink>
            </motion.div>
          ))}
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={handleGetStarted} className="px-6 py-2 text-base font-medium">
              Get Started
            </Button>
          </motion.div>
        </div>

        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
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
            className="fixed inset-y-0 right-0 z-50 w-72 bg-background shadow-lg md:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-4 border-b border-border">
                <Logo />
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
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
                      className="px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                      activeClass="text-primary"
                      onClick={closeMobileMenu}
                    >
                      {item.name}
                    </ScrollLink>
                  </motion.div>
                ))}
              </motion.div>
              <div className="mt-auto p-4 border-t border-border">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    className="w-full px-6 py-2 text-base font-medium"
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
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={closeMobileMenu}
          />
        )}
      </AnimatePresence>
    </>
  )
}

