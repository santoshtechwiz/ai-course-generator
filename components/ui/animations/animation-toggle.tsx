"use client"

import { useAnimation } from "@/providers/animation-provider"
import { Button } from "@/components/ui/button"
import { Sparkles, SparkleIcon as SparklesOff } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function AnimationToggle({ className }: { className?: string }) {
  const { animationsEnabled, toggleAnimations, reducedMotion } = useAnimation()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={toggleAnimations} className={className} disabled={reducedMotion}>
            {animationsEnabled ? <Sparkles className="h-4 w-4" /> : <SparklesOff className="h-4 w-4" />}
            <span className="sr-only">{animationsEnabled ? "Disable animations" : "Enable animations"}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {reducedMotion
            ? "Animations disabled due to reduced motion preference"
            : animationsEnabled
              ? "Disable animations"
              : "Enable animations"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
