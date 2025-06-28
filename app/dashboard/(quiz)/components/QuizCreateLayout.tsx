"use client"

import React, { useMemo } from "react"
import { useMediaQuery } from "@/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RandomQuiz } from "./layouts/RandomQuiz"
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
          <div className="container py-6 space-y-6 max-w-4xl">
            {/* Page title and description */}
            <div className="flex flex-col space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>

            {/* Quiz Form */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Create {title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </div>

                  {helpText && (
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
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {children}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarContent}
      </div>
    </div>
  )
}
