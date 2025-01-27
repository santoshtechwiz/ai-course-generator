"use client"

import * as React from "react"
import { Link as ScrollLink } from "react-scroll"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Logo from "../shared/Logo"

const navItems = [
  { name: "Features", to: "features" },
  { name: "How It Works", to: "how-it-works" },
  { name: "Showcase", to: "showcase" },
  {name:'Faq',to:'faq'},
  {name:'About',to:'about'}
]

export default function LandingHeader() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleGetStarted = () => {
    router.push("/dashboard")
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/80 backdrop-blur-lg border-b border-border" : "bg-transparent",
      )}
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <ScrollLink
          to="hero"
          spy={true}
          smooth={true}
          offset={-64}
          duration={500}
          className="flex items-center space-x-2 cursor-pointer"
        >
          
          
        </ScrollLink>
        <Logo></Logo>
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <ScrollLink
              key={item.to}
              to={item.to}
              spy={true}
              smooth={true}
              offset={-64}
              duration={500}
              className="text-sm font-medium text-muted-foreground hover:text-primary cursor-pointer"
              activeClass="text-primary"
            >
              {item.name}
            </ScrollLink>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <Button onClick={handleGetStarted}>Get Started</Button>
        </div>
      </nav>
    </motion.header>
  )
}

