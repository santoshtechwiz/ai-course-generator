"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, BookOpen, HelpCircle } from "lucide-react"

interface CreateOption {
  title: string
  description: string
  href: string
  buttonText: string
  icon: React.ElementType
}

const createOptions: CreateOption[] = [
  {
    title: "MCQ Quiz",
    description: "Create a new multiple-choice quiz to test knowledge with predefined answers.",
    href: "/dashboard/mcq",
    buttonText: "Start Creating",
    icon: HelpCircle,
  },
  {
    title: "Open Ended Quiz",
    description: "Create an openended quiz to allow for more detailed responses.",
    href: "/dashboard/openended",
    buttonText: "Begin Quiz",
    icon: Zap,
  },
  {
    title: "Course",
    description: "Create a comprehensive course with multiple modules and lessons.",
    href: "/dashboard/create",
    buttonText: "Create Course",
    icon: BookOpen,
  },
]

export function CreateSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6 w-full max-w-5xl mx-auto bg-background">
      <AnimatePresence>
        {createOptions.map((option, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              className="h-full bg-card hover:shadow-lg transition-all duration-300 relative overflow-hidden"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <CardHeader className="p-6">
                <div className="flex items-center space-x-3">
                  <option.icon className="w-6 h-6 text-primary" />
                  <CardTitle className="text-xl font-semibold">{option.title}</CardTitle>
                </div>
                <CardDescription className="text-base text-muted-foreground mt-3 hidden sm:block">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <Button
                  asChild
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base"
                  size="lg"
                >
                  <Link href={option.href}>
                    <span className="sm:hidden">{option.title}</span>
                    <span className="hidden sm:inline">{option.buttonText}</span>
                  </Link>
                </Button>
              </CardContent>
              <motion.div
                className="absolute inset-0 bg-primary/10 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

