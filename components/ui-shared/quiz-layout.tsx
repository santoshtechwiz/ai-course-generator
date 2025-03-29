"use client"

import type React from "react"
import { CardContainer } from "./card-container"
import { SectionHeader } from "./section-header"
import { ProgressIndicator } from "./progress-indicator"
import { ButtonGroup } from "./button-group"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QuizLayoutProps {
  title: string
  subtitle?: string
  currentQuestion: number

  children: React.ReactNode
  className?: string
  showProgress?: boolean
}

export const QuizLayout = ({
  title,
  subtitle,
  currentQuestion,

  children,
  className,
  showProgress = true,
}: QuizLayoutProps) => {
  return (
    <CardContainer className={cn("w-full max-w-4xl mx-auto", className)}>
      <SectionHeader title={title} subtitle={subtitle} centered />

    
      <div className="mb-8">{children}</div>


    </CardContainer>
  )
}

