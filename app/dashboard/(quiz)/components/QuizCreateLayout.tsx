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
      <div
        className={`
        w-full 
        ${isMobile ? "order-first mb-6" : isTablet ? "order-last mt-6 lg:mt-0" : "lg:w-80 xl:w-96 order-last"}
        ${!isMobile ? "lg:sticky lg:top-6" : ""}
        shrink-0
      `}
      >
        <div
          className={`
          ${isMobile ? "px-4" : isTablet ? "px-6" : "px-4"}
          ${isMobile ? "max-w-md mx-auto" : ""}
        `}
        >
          <RandomQuiz />
        </div>
      </div>
    )
  }, [isMobile, isTablet])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background to-muted/20">
      <div
        className={`
        container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl
        ${isMobile ? "space-y-6" : "flex flex-col lg:flex-row gap-6 lg:gap-8"}
      `}
      >
        {/* Main Content */}
        <div
          className={`
          ${isMobile ? "w-full" : "flex-1 min-w-0"}
          ${!isMobile ? "lg:max-w-4xl" : ""}
        `}
        >
          <Card className="bg-background/95 backdrop-blur-sm border border-border shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader
              className={`
              bg-gradient-to-r from-primary/5 to-primary/10 
              border-b border-border/60 
              ${isMobile ? "px-4 py-6" : "px-6 py-8 lg:px-8 lg:py-10"} 
              relative overflow-hidden
            `}
            >
              {/* Background decoration */}
              <div className="absolute inset-0 bg-grid-pattern opacity-5" />

              <div className="relative z-10">
                <div className="flex justify-center mb-4 lg:mb-6">
                  <motion.div
                    className={`
                      ${isMobile ? "p-3" : "p-4"} 
                      bg-primary/10 rounded-xl shadow-sm ring-1 ring-primary/20
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <TextQuote
                      className={`
                      ${isMobile ? "w-6 h-6" : "w-8 h-8 lg:w-10 lg:h-10"} 
                      text-primary
                    `}
                    />
                  </motion.div>
                </div>

                <CardTitle
                  className={`
                  ${isMobile ? "text-xl" : "text-2xl sm:text-3xl lg:text-4xl"} 
                  font-bold text-center text-primary leading-tight mb-3
                `}
                >
                  {title} Quiz
                </CardTitle>

                <p
                  className={`
                  text-center text-muted-foreground 
                  ${isMobile ? "text-sm" : "text-base sm:text-lg lg:text-xl"} 
                  max-w-2xl mx-auto leading-relaxed
                `}
                >
                  {description}
                </p>

                {helpText && (
                  <div
                    className={`
                    absolute 
                    ${isMobile ? "top-3 right-3" : "top-4 right-4 lg:top-6 lg:right-6"}
                  `}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size={isMobile ? "sm" : "icon"}
                            className="bg-background/50 backdrop-blur-sm"
                          >
                            <HelpCircle className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-muted-foreground`} />
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

            <CardContent
              className={`
              ${isMobile ? "px-4 py-6" : "px-6 py-8 lg:px-8 lg:py-10"}
            `}
            >
              {children}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        {sidebarContent}
      </div>
    </div>
  )
}
