"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import Logo from "./Logo"
import { Twitter, Facebook, Linkedin, ArrowRight, Mail } from "lucide-react"

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
  { icon: Twitter, label: "Twitter" },
  { icon: Facebook, label: "Facebook" },
  { icon: Linkedin, label: "LinkedIn" },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <motion.footer
      className="border-t bg-background mt-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="content-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          {/* Logo and Social Links */}
          <div className="md:col-span-4 space-y-6">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Logo size="large" />
            </motion.div>
            <p className="body-normal text-muted-foreground max-w-md">
              Empowering education through AI-driven learning experiences. Create and take quizzes, generate courses,
              and enhance your educational journey.
            </p>
            <div className="flex space-x-2">
              {socialLinks.map((social) => (
                <Button
                  key={social.label}
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-accent hover:text-accent-foreground"
                >
                  <social.icon className="h-5 w-5" />
                  <span className="sr-only">{social.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {footerLinks.map((section) => (
              <div key={section.title} className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          variant="link"
                          asChild
                          className="text-muted-foreground hover:text-foreground transition-colors p-0 h-auto font-normal"
                        >
                          <Link href={link.href}>{link.name}</Link>
                        </Button>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter Subscription */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Stay Updated</h3>
            <p className="body-small text-muted-foreground">
              Subscribe to our newsletter for the latest updates and features.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" placeholder="Email address" className="pl-10 rounded-full" />
              </div>
              <Button size="icon" className="rounded-full">
                <ArrowRight className="h-4 w-4" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} Course AI. All rights reserved.</p>
          <p className="text-center md:text-right">
            AI can make mistakes. Course AI is an AI-powered tool and may produce incorrect or biased information.
            Always verify important information.
          </p>
        </div>
      </div>
    </motion.footer>
  )
}

