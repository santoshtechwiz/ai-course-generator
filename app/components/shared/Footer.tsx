"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Logo from "./Logo"

export default function Footer() {
  return (
    <motion.footer
      className="border-t bg-background mt-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container px-4 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Logo */}
          <motion.div className="flex items-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Logo />
          </motion.div>

          {/* Navigation */}
          <nav className="flex flex-wrap gap-4">
            {["Courses", "Privacy", "Terms"].map((item, index) => (
              <motion.div key={item} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  asChild
                  size="sm"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Link href={`/${item.toLowerCase()}`}>{item}</Link>
                </Button>
              </motion.div>
            ))}
          </nav>

          {/* Copyright */}
          <motion.div className="text-sm text-muted-foreground" whileHover={{ scale: 1.05 }}>
            © {new Date().getFullYear()} Course AI
          </motion.div>
        </div>

        <Separator className="my-6" />

        {/* Disclaimer */}
        <motion.div
          className="text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="leading-relaxed">
            Disclaimer: AI can make mistakes. Course AI is an AI-powered tool and may produce incorrect or biased
            information. Always verify important information. The information provided is for general purposes only.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  )
}

