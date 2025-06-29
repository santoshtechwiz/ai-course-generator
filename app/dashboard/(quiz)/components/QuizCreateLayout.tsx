"use client"

import React, { useMemo } from "react"
import { useMediaQuery } from "@/hooks"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { RandomQuiz } from "./layouts/RandomQuiz"
import { HelpCircle, TextQuote } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion } from "framer-motion"

interface QuizCreateLayoutProps {
  children: React.ReactNode
  title: string
  description: string
  quizType: "mcq" | "code" | "blanks" | "quiz" | "openended" | "video" | "pdf"
  helpText?: string
  isLoggedIn: boolean
}

export function QuizCreateLayout({
  children,
  title,
  description,
  helpText,
  isLoggedIn,
}: QuizCreateLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 1024px)")

  const sidebarContent = useMemo(() => {
    if (isMobile) return null
    return (
      <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0">
        <div className="sticky top-24">
          <RandomQuiz />
        </div>
      </div>
    )
  }, [isMobile])

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main content */}
        <div className="flex-1 border-r">
          <div className="container py-6 max-w-4xl space-y-6">
            {/* Quiz Card */}
            <Card className="bg-background border border-border shadow-sm hover:shadow-md transition-all duration-300">
              {/* Hero Header */}
              <CardHeader className="bg-primary/5 border-b border-border/60 pb-6 relative">
                <div className="flex justify-center mb-4">
                  <motion.div
                    className="p-3 bg-primary/10 rounded-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <TextQuote className="w-8 h-8 text-primary" />
                  </motion.div>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold text-center text-primary">
                  {title} Quiz
                </CardTitle>
                <p className="text-center text-base md:text-lg text-muted-foreground mt-2">
                  {description}
                </p>

                {helpText && (
                  <div className="absolute top-6 right-6">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <HelpCircle className="h-5 w-5 text-muted-foreground" />
                            <span className="sr-only">Help</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p>{helpText}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </CardHeader>

           

              {/* Form Content */}
              <CardContent>{children}</CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarContent}
      </div>
    </div>
  )
}
