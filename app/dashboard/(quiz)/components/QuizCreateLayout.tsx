"use client"

import React, { useMemo } from "react"
import { useMediaQuery } from "@/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RandomQuiz } from "./layouts/RandomQuiz"
import { ArrowLeft, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { QuizFooter } from "@/components/quiz/QuizFooter"

interface QuizCreateLayoutProps {
  children: React.ReactNode
  title: string
  description: string
  quizType: "mcq" | "code" | "blanks" | "quiz" | "others"
  helpText?: string
  practiceContent?: React.ReactNode
  myQuizzesContent?: React.ReactNode
  isLoggedIn: boolean
}

/**
 * Common layout component for all quiz creation forms
 * Provides consistent UI with tabs, sidebar with random quiz, and footer
 */
export function QuizCreateLayout({
  children,
  title,
  description,
  quizType,
  helpText,
  practiceContent,
  myQuizzesContent,
  isLoggedIn
}: QuizCreateLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 1024px)")
  
  // Memoize sidebar component to prevent unnecessary re-renders
  const sidebarContent = useMemo(() => {
    if (isMobile) return null;
    return (
      <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0">
        <div className="sticky top-24">
          <RandomQuiz />
        </div>
      </div>
    );
  }, [isMobile]);
  
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main content area */}
        <div className="flex-1 border-r">
          <div className="container py-6 space-y-6 max-w-4xl">
            <div className="flex flex-col space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground">
                {description}
              </p>
            </div>
            <div className="border-t pt-6">
              <Tabs defaultValue="create" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="create">Create Quiz</TabsTrigger>
                  <TabsTrigger value="practice">Practice</TabsTrigger>
                  <TabsTrigger value="my-quizzes">My Quizzes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="create" className="space-y-4">
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
                </TabsContent>
                
                <TabsContent value="practice">
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Practice {title}</h2>
                    {practiceContent || (
                      <p className="text-muted-foreground">
                        Select from our pre-built quizzes to test your knowledge.
                      </p>
                    )}
                  </Card>
                </TabsContent>
                
                <TabsContent value="my-quizzes">
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">My {title}</h2>
                    {isLoggedIn ? (
                      myQuizzesContent || (
                        <p className="text-muted-foreground">
                          View and manage your previously created quizzes.
                        </p>
                      )
                    ) : (
                      <p className="text-muted-foreground">
                        Please sign in to view your quizzes.
                      </p>
                    )}
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
        
        {/* Right sidebar - Random Quizzes */}
        {sidebarContent}
      </div>
      
      {/* Footer */}
      <QuizFooter />
    </div>
  )
}
