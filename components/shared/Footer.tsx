"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Logo from "./Logo"
import { Twitter, Facebook, Linkedin, Instagram } from "lucide-react"
import { NewsletterForm } from "../newsletter-form"


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
      { name: "About Us", href: "/about" },
      { name: "Help Center", href: "/contactus" },
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
  const currentYear = new Date().getFullYear()

  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemAnimation = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  }

  return (
    <footer className="border-t bg-background mt-auto">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8"
          variants={containerAnimation}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Logo and Description */}
          <motion.div className="lg:col-span-4 space-y-6" variants={itemAnimation}>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
              <Link href="/">
                <Logo size="large" />
              </Link>
            </motion.div>

            <p className="text-base text-muted-foreground max-w-md">
              Empowering education through AI-driven learning experiences. Create and take quizzes, generate courses,
              and enhance your educational journey.
            </p>

            <div className="flex gap-2 pt-2">
              {socialLinks.map((social) => (
                <Button
                  key={social.label}
                  variant="outline"
                  size="icon"
                  className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
                  asChild
                >
                  <Link href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                    <social.icon className="h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Navigation Links */}
          <motion.div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-8" variants={itemAnimation}>
            {footerLinks.map((section) => (
              <div key={section.title} className="space-y-4">
                <h3 className="text-sm font-semibold tracking-wide text-foreground">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          variant="link"
                          asChild
                          className="text-muted-foreground hover:text-foreground transition-colors p-0 h-auto font-normal text-sm"
                        >
                          <Link href={link.href}>{link.name}</Link>
                        </Button>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>

          {/* Newsletter Subscription */}
          <motion.div className="lg:col-span-3 space-y-4" variants={itemAnimation}>
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-foreground mb-4">Stay Updated</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Subscribe to our newsletter for the latest updates and features.
              </p>

              <NewsletterForm />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© {currentYear} CourseAI. All rights reserved.</p>

            <p className="text-xs text-muted-foreground text-center md:text-right max-w-md">
              AI can make mistakes. CourseAI is an AI-powered tool and may produce incorrect or biased information.
              Always verify important information.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

