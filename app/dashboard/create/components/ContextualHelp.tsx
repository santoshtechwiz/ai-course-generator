"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
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

export function ContextualHelp({ 
  title, 
  description, 
  children, 
  side = "top", 
  align = "center" 
}: ContextualHelpProps) {
  const [open, setOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = () => {
    setIsHovering(true)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    // Auto-close after 300ms of mouse leaving
    timeoutRef.current = setTimeout(() => {
      if (!isHovering) {
        setOpen(false)
      }
    }, 300)
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(!open)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div 
          className="relative group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-yellow-400 hover:bg-yellow-500 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] border-2 border-black z-10"
            onClick={handleButtonClick}
            aria-label="Show help"
          >
            <HelpCircle className="h-3.5 w-3.5 text-black" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent 
        side={side} 
        align={align} 
        className="w-80 border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="space-y-3 p-4">
          {/* Title with accent background */}
          <div className="bg-blue-400 border-2 border-black px-3 py-2 -mx-4 -mt-4 mb-3">
            <h4 className="font-bold text-black text-base">{title}</h4>
          </div>
          
          {/* Description */}
          <p className="text-sm text-gray-800 leading-relaxed">
            {description}
          </p>
          
          {/* Decorative bottom border */}
          <div className="h-1 bg-yellow-400 border-t-2 border-black -mx-4 -mb-4 mt-4" />
        </div>
      </PopoverContent>
    </Popover>
  )
}