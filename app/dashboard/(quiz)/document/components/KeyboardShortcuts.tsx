"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Keyboard } from "lucide-react"

interface KeyboardShortcut {
  keys: string[]
  description: string
  condition?: string
}

interface KeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[]
  className?: string
}

export function KeyboardShortcuts({ shortcuts, className = "" }: KeyboardShortcutsProps) {
  const formatKey = (key: string) => {
    const keyMap: Record<string, string> = {
      Ctrl: "⌃",
      Cmd: "⌘",
      Alt: "⌥",
      Shift: "⇧",
      Enter: "↵",
      Escape: "Esc",
      ArrowUp: "↑",
      ArrowDown: "↓",
      ArrowLeft: "←",
      ArrowRight: "→",
    }
    return keyMap[key] || key
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={`border-dashed bg-muted/30 hover:bg-muted/50 transition-colors cursor-help ${className}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Keyboard className="h-3 w-3" />
                <span>Keyboard shortcuts</span>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium text-xs mb-2">Available shortcuts:</p>
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <Badge key={keyIndex} variant="outline" className="text-xs px-1.5 py-0.5 font-mono">
                      {formatKey(key)}
                    </Badge>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {shortcut.description}
                  {shortcut.condition && (
                    <span className="text-xs text-muted-foreground/70 ml-1">({shortcut.condition})</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
