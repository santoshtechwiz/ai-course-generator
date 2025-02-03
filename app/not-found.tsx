"use client"

import Link from "next/link"
import { BookOpen, HelpCircle, PlusCircle, ArrowLeft, Compass } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { motion } from "framer-motion"
import Footer from "./components/shared/Footer"
import Navbar from "./components/shared/Navbar"

export default function NotFound() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  const suggestedPages = [
  
    { href: "/dashboard/create", icon: PlusCircle, title: "Create", description: "Start creating your own content" },
    { href: "/dashboard/", icon: Compass, title: "Explore", description: "Discover new learning opportunities" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          className="max-w-4xl w-full space-y-12 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
        
          <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={itemVariants}>
            Oops! It seems you've ventured into uncharted territory. Don't worry, though – there's still plenty to
            explore!
          </motion.p>

          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Where to next?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestedPages.map((item) => (
                <motion.div key={item.href} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href={item.href} className="block h-full">
                    <Card className="h-full hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm border-primary/10">
                      <CardContent className="flex flex-col items-center justify-center p-6 h-full">
                        <item.icon className="h-12 w-12 text-primary mb-4" />
                        <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/">
                <ArrowLeft className="mr-2 h-5 w-5" /> Return to Home
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}

