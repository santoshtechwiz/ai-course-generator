"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { NewsletterForm } from "../newsletter-form"

import {
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
} from "lucide-react"
import Logo from "./Logo"

const footerLinks = [
  {
    title: "Platform",
    links: [
      { name: "Explore", href: "/dashboard/explore" },
      { name: "Courses", href: "/dashboard" },
      { name: "Quizzes", href: "/dashboard/quizzes" },
      { name: "Create", href: "/dashboard/create" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Dashboard", href: "/dashboard" },
      { name: "My Progress", href: "/dashboard/account" },
      { name: "Subscription", href: "/dashboard/subscription" },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "About", href: "/dashboard/about" },
      { name: "Contact Us", href: "/contactus" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ],
  },
]

const socialLinks = [
  { icon: Twitter, label: "Twitter", href: "https://twitter.com/courseai" },
  { icon: Facebook, label: "Facebook", href: "https://facebook.com/courseailearning" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/courseai" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/courseai_official" },
]

export default function Footer() {
  const year = new Date().getFullYear()

  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  }

  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  }

  return (
    <footer className="w-full border-t-6 border-border bg-[var(--color-bg)] mt-auto relative z-10 print:hidden neo-shadow" role="contentinfo">
      <motion.div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-12"
        variants={containerAnimation}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Logo + Description */}
        <motion.div className="lg:col-span-4 space-y-6" variants={itemAnimation}>
          <Link href="/" className="inline-block neo-hover-lift" aria-label="Return to homepage">
            <div className="p-3 bg-[var(--color-primary)] border-4 border-border neo-shadow rounded-none">
              <Logo />
            </div>
          </Link>
          <p className="text-[var(--color-text)]/70 text-sm sm:text-base leading-relaxed max-w-sm font-bold">
            Create courses using YouTube videos and generate intelligent quizzes with AI assistance. Build engaging
            learning experiences and track progress effectively.
          </p>
          <nav className="flex gap-3 pt-1" role="navigation" aria-label="Social media links">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <motion.div
                key={label}
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 border-4 border-border bg-[var(--color-card)] neo-shadow neo-hover-lift neo-press rounded-none hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-all duration-200"
                >
                  <Link href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                    <Icon className="h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </nav>
        </motion.div>

        {/* Navigation Sections */}
        <motion.div
          className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8"
          variants={itemAnimation}
        >
          {footerLinks.map((section) => (
            <nav key={section.title} className="space-y-4" role="navigation" aria-labelledby={`footer-${section.title.toLowerCase()}`}>
              <h4 id={`footer-${section.title.toLowerCase()}`} className="text-sm font-black tracking-wider text-[var(--color-text)] uppercase border-b-3 border-[var(--color-primary)] pb-2">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <motion.div
                      whileHover={{ scale: 1.02, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="ghost"
                        asChild
                        className="p-0 h-auto text-[var(--color-text)]/70 hover:text-[var(--color-primary)] text-sm font-bold uppercase tracking-wide neo-hover-lift justify-start"
                      >
                        <Link href={link.href} className="border-b-2 border-transparent hover:border-[var(--color-primary)] transition-all duration-200">
                          {link.name}
                        </Link>
                      </Button>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </motion.div>

        {/* Newsletter */}
        <motion.div className="lg:col-span-3 space-y-5" variants={itemAnimation}>
          <div className="space-y-3">
            <h4 className="text-sm font-black tracking-wider text-[var(--color-text)] uppercase border-b-3 border-[var(--color-secondary)] pb-2">
              Stay Updated
            </h4>
            <p className="text-sm text-[var(--color-text)]/70 leading-relaxed font-bold">
              Subscribe to our newsletter for the latest updates and features.
            </p>
          </div>
          <div className="neo-card p-4 bg-[var(--color-card)]">
            <NewsletterForm />
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom Bar */}
      <div className="border-t-4 border-border bg-[var(--color-card)] neo-shadow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-sm text-[var(--color-text)] font-black uppercase tracking-wider">
              © {year} CourseAI. All rights reserved.
            </p>
          </div>
          <div className="text-center md:text-right max-w-md">
            <div className="neo-card p-4 bg-[var(--color-warning)]/10 border-3 border-[var(--color-warning)]">
              <p className="text-xs text-[var(--color-text)] font-bold leading-relaxed">
                ⚠️ AI can make mistakes. CourseAI is an AI-powered tool and may produce incorrect or biased
                information. Always verify important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
