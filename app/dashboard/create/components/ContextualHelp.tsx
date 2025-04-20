"use client"

import type React from "react"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"

interface ContextualHelpProps {
  title: string
  description: string
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function ContextualHelp({ title, description, children, side = "top", align = "center" }: ContextualHelpProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative group">
          {children}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background rounded-full shadow-sm border"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(true)
            }}
          >
            <HelpCircle className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
