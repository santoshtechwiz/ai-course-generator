"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

const MotionCard = motion(Card)

interface CreateOption {
  title: string
  description: string
  href: string
  buttonText: string
}

export function CreateSection() {
  const createOptions: CreateOption[] = [
    {
      title: "MCQ Quiz",
      description: "Create a new multiple-choice quiz to test knowledge with predefined answers.",
      href: "/dashboard/quiz",
      buttonText: "Start Creating"
    },
    {
      title: "Open Quiz",
      description: "Create an open-ended quiz to allow for more detailed responses.",
      href: "/dashboard/openended",
      buttonText: "Begin Quiz"
    },
    {
      title: "Course",
      description: "Create a comprehensive course with multiple modules and lessons.",
      href: "/dashboard/create",
      buttonText: "Create Course"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 w-[800px] bg-white">
      {createOptions.map((option, index) => (
        <MotionCard 
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.1 }}
          className="bg-white border-border hover:shadow-md transition-all duration-200"
        >
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{option.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {option.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              asChild 
              className="w-full bg-red-500 hover:bg-red-600 text-white"
              size="sm"
            >
              <Link href={option.href}>
                {option.buttonText}
              </Link>
            </Button>
          </CardContent>
        </MotionCard>
      ))}
    </div>
  )
}

