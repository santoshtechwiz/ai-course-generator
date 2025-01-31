"use client"

import Link from "next/link"
import { Search, BookOpen, HelpCircle, PlusCircle, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "./components/shared/Navbar"
import Footer from "./components/shared/Footer"
import { AnimatedQuizHighlight } from "./components/RanomQuiz"
import { motion } from "framer-motion"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          className="max-w-3xl w-full space-y-8 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Image src="/404-illustration.svg" alt="404 Illustration" width={400} height={400} className="mx-auto" />
          </motion.div>
          <motion.h1 className="mt-6 text-4xl font-extrabold text-foreground sm:text-5xl" variants={itemVariants}>
            Oops! Page not found
          </motion.h1>
          <motion.p className="mt-2 text-lg text-muted-foreground" variants={itemVariants}>
            The page you're looking for doesn't exist or has been moved.
          </motion.p>
          <motion.div className="mt-6" variants={itemVariants}>
            <AnimatedQuizHighlight />
          </motion.div>
         
          <motion.div className="mt-12" variants={itemVariants}>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Suggested Pages</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { href: "/dashboard/courses", icon: BookOpen, title: "Courses", description: "Explore our courses" },
                { href: "/dashboard/quizzes", icon: HelpCircle, title: "Quizzes", description: "Test your knowledge" },
                {
                  href: "/dashboard/create",
                  icon: PlusCircle,
                  title: "Create New",
                  description: "Start a new project",
                },
              ].map((item, index) => (
                <motion.div key={item.href} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href={item.href} className="block h-full">
                    <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="flex flex-col items-center justify-center p-6 h-full">
                        <item.icon className="h-12 w-12 text-primary mb-4" />
                        <h3 className="font-semibold text-lg text-foreground">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div className="mt-12" variants={itemVariants}>
            <Button asChild size="lg">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}

