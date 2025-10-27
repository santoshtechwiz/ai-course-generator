"use client"

import type React from "react"
import { useMemo } from "react"
import { useMediaQuery } from "@/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RandomQuiz } from "@/app/dashboard/(quiz)/components/layouts/RandomQuiz"
import { HelpCircle, TextQuote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"

interface QuizCreateInterfaceProps {
  children: React.ReactNode
  title: string
  description: string
  quizType: "mcq" | "code" | "blanks" | "quiz" | "openended" | "video" | "pdf"
  helpText?: string
  isLoggedIn: boolean
}

export function QuizCreateInterface({ children, title, description, helpText, isLoggedIn }: QuizCreateInterfaceProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="max-w-none mx-auto px-2 sm:px-3 lg:px-4 py-3 sm:py-4">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          <Card className="flex-1 border-4 border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-neo)]">
            <CardHeader className="bg-[var(--color-primary)] border-b-4 border-[var(--color-border)] px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 relative">
              <div className="text-center space-y-2 sm:space-y-3">
                <motion.div
                  className="inline-flex p-2 sm:p-2.5 bg-[var(--color-bg)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)] rounded-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <TextQuote className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[var(--color-text)]" />
                </motion.div>

                <div className="space-y-2">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-black text-[var(--color-bg)] leading-tight">
                    {title} <span className="text-[var(--color-text)] bg-[var(--color-bg)] px-2 py-1 border-2 border-[var(--color-border)]">Quiz</span>
                  </CardTitle>

                  <p className="text-xs sm:text-sm lg:text-base text-[var(--color-bg)]/90 max-w-2xl mx-auto leading-relaxed px-2 font-bold">
                    {description}
                  </p>
                </div>

                {helpText && (
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="neutral" size="icon" className="bg-[var(--color-card)] border-2 border-[var(--color-border)] h-7 w-7 sm:h-8 sm:w-8">
                            <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--color-text)]" />
                            <span className="sr-only">Help</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs text-xs sm:text-sm bg-[var(--color-card)] border-2 border-[var(--color-border)] text-[var(--color-text)]">
                          <p>{helpText}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 flex-1 bg-[var(--color-card)]">
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