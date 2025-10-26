"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ContextualHelpProps {
  title: string
  description: string
  children: React.ReactNode
}

export function ContextualHelp({ title, description, children }: ContextualHelpProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="relative group">
        {children}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-card rounded-full border-4 border-border shadow-neo hover:bg-accent/10"
          onClick={(e) => {
            e.stopPropagation()
            setOpen(!open)
          }}
        >
          <HelpCircle className="h-4 w-4 text-foreground" />
        </Button>
      </div>

      {open && (
        <Card className="mt-4 border-4 border-border shadow-neo bg-card animate-in fade-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-3 border-b-4 border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent/10 border-4 border-accent flex items-center justify-center">
                  <HelpCircle className="h-3 w-3 text-accent" />
                </div>
                <CardTitle className="text-base font-black uppercase">{title}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 border-2 border-border rounded-full hover:bg-accent/10"
                onClick={() => setOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
