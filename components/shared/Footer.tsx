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
      { name: "Dashboard", href: "/dashboard" },
      { name: "Quizzes", href: "/dashboard/quizzes" },
      { name: "Courses", href: "/dashboard" },
      { name: "Create", href: "/dashboard/explore" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Learning Path", href: "/dashboard/dashboard" },
      { name: "Membership", href: "/dashboard/subscription" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Contact Us", href: "/contactus" },
    ],
  },
]

const socialLinks = [
  { icon: Twitter, label: "Twitter", href: "https://twitter.com" },
  { icon: Facebook, label: "Facebook", href: "https://facebook.com" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com" },
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
    <footer className="w-full border-t border-border bg-background mt-auto relative print:hidden">
      <motion.div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10"
        variants={containerAnimation}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Logo + Description */}
        <motion.div className="lg:col-span-4 space-y-6" variants={itemAnimation}>
          <Link href="/" className="inline-block">
           <Logo/>
          </Link>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
            Empowering education through AI-driven learning experiences. Create and take quizzes,
            generate courses, and enhance your educational journey.
          </p>
          <div className="flex gap-3 pt-1">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <Button
                key={label}
                asChild
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-primary hover:text-white transition"
              >
                <Link href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  <Icon className="h-5 w-5" />
                </Link>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Navigation Sections */}
        <motion.div
          className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-6"
          variants={itemAnimation}
        >
          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Button
                      variant="link"
                      asChild
                      className="p-0 h-auto text-muted-foreground hover:text-foreground text-sm font-normal"
                    >
                      <Link href={link.href}>{link.name}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Newsletter */}
        <motion.div className="lg:col-span-3 space-y-5" variants={itemAnimation}>
          <h4 className="text-sm font-semibold tracking-wide text-foreground uppercase mb-2">
            Stay Updated
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Subscribe to our newsletter for the latest updates and features.
          </p>
          <NewsletterForm />
        </motion.div>
      </motion.div>

      {/* Footer Bottom Bar */}
      <div className="border-t border-border bg-muted">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {year} CourseAI. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground text-center md:text-right max-w-md leading-relaxed">
            AI can make mistakes. CourseAI is an AI-powered tool and may produce incorrect or biased
            information. Always verify important information.
          </p>
        </div>
      </div>
    </footer>
  )
}
