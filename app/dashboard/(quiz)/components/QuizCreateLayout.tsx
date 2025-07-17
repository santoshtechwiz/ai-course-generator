"use client"

import type React from "react"
import { useMemo } from "react"
import { useMediaQuery } from "@/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RandomQuiz } from "./layouts/RandomQuiz"
import { HelpCircle, TextQuote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"

interface QuizCreateLayoutProps {
  children: React.ReactNode
  title: string
  description: string
  quizType: "mcq" | "code" | "blanks" | "quiz" | "openended" | "video" | "pdf"
  helpText?: string
  isLoggedIn: boolean
}

export function QuizCreateLayout({ children, title, description, helpText, isLoggedIn }: QuizCreateLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")

  const sidebarContent = useMemo(() => {
    return (
      <aside className="w-full lg:w-80 xl:w-96 shrink-0">
        <div className="lg:sticky lg:top-8">
          <RandomQuiz />
        </div>
      </aside>
    )
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <Card className="overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm">
            <CardHeader className="relative bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/50 px-6 py-8 lg:px-8 lg:py-12">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-grid-pattern opacity-5" />

              <div className="relative z-10 text-center space-y-6">
                <motion.div
                  className="inline-flex p-4 bg-primary/10 rounded-2xl shadow-sm ring-1 ring-primary/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <TextQuote className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />
                </motion.div>

                <div className="space-y-4">
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                    {title} <span className="text-primary">Quiz</span>
                  </CardTitle>

                  <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {description}
                  </p>
                </div>

                {helpText && (
                  <div className="absolute top-6 right-6">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-colors">
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
              </div>
            </CardHeader>

            <CardContent className="px-6 py-8 lg:px-8 lg:py-12">
              {children}
            </CardContent>
          </Card>

          {/* Sidebar */}
          {sidebarContent}
        </div>
      </div>
    </div>
  )
}
