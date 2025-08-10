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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-none mx-auto px-2 sm:px-3 lg:px-4 py-3 sm:py-4">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          <Card className="flex-1 border border-border/30 shadow-lg bg-card/40 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/30 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 relative">
              <div className="text-center space-y-2 sm:space-y-3">
                <motion.div
                  className="inline-flex p-2 sm:p-2.5 bg-primary/10 rounded-xl shadow-sm ring-1 ring-primary/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <TextQuote className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary" />
                </motion.div>

                <div className="space-y-2">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight">
                    {title} <span className="text-primary">Quiz</span>
                  </CardTitle>

                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
                    {description}
                  </p>
                </div>

                {helpText && (
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-colors h-7 w-7 sm:h-8 sm:w-8">
                            <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            <span className="sr-only">Help</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs text-xs sm:text-sm">
                          <p>{helpText}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 flex-1">
              <div className="h-full">
                {children}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0">
            <div className="lg:sticky lg:top-4 space-y-3 sm:space-y-4">
              <RandomQuiz />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
