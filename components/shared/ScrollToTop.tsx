"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowUp } from "lucide-react"

const ScrollToTop = () => {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: showScrollTop ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed bottom-8 right-8 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors duration-200 ${
        showScrollTop ? "visible" : "invisible"
      }`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-6 w-6" />
    </motion.button>
  )
}

export default ScrollToTop
