"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: showScrollTop ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed bottom-8 right-8 ${showScrollTop ? "visible" : "invisible"}`}
    >
      <Button
        aria-label="Scroll to top"
        size="icon"
        variant="default"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="shadow-lg"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </motion.div>
  )
}

export default ScrollToTop
