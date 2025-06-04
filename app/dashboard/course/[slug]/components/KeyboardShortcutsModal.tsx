"use client"

// Create a new file for keyboard shortcuts modal
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Keyboard } from "lucide-react"

interface KeyboardShortcut {
  key: string
  description: string
  category: "playback" | "navigation" | "volume" | "other"
}

const shortcuts: KeyboardShortcut[] = [
  { key: "Space", description: "Play/Pause", category: "playback" },
  { key: "K", description: "Play/Pause", category: "playback" },
  { key: "J", description: "Rewind 10 seconds", category: "playback" },
  { key: "L", description: "Forward 10 seconds", category: "playback" },
  { key: "←", description: "Rewind 5 seconds", category: "playback" },
  { key: "→", description: "Forward 5 seconds", category: "playback" },
  { key: "0-9", description: "Jump to 0-90% of video", category: "navigation" },
  { key: "Home", description: "Go to beginning of video", category: "navigation" },
  { key: "End", description: "Go to end of video", category: "navigation" },
  { key: "F", description: "Toggle fullscreen", category: "other" },
  { key: "M", description: "Mute/Unmute", category: "volume" },
  { key: "↑", description: "Increase volume", category: "volume" },
  { key: "↓", description: "Decrease volume", category: "volume" },
  { key: "C", description: "Toggle captions", category: "other" },
  { key: "T", description: "Toggle theater mode", category: "other" },
  { key: "P", description: "Toggle picture-in-picture", category: "other" },
  { key: "B", description: "Add bookmark at current time", category: "other" },
]

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
          <Keyboard className="h-3 w-3" />
          <span>Keyboard Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div>
            <h3 className="font-medium text-sm mb-2 text-primary">Playback Controls</h3>
            <div className="space-y-2">
              {shortcuts
                .filter((s) => s.category === "playback")
                .map((shortcut, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-semibold">{shortcut.key}</kbd>
                    <span>{shortcut.description}</span>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-sm mb-2 text-primary">Navigation</h3>
            <div className="space-y-2">
              {shortcuts
                .filter((s) => s.category === "navigation")
                .map((shortcut, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-semibold">{shortcut.key}</kbd>
                    <span>{shortcut.description}</span>
                  </div>
                ))}
            </div>

            <h3 className="font-medium text-sm mb-2 mt-4 text-primary">Volume Controls</h3>
            <div className="space-y-2">
              {shortcuts
                .filter((s) => s.category === "volume")
                .map((shortcut, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-semibold">{shortcut.key}</kbd>
                    <span>{shortcut.description}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-medium text-sm mb-2 text-primary">Other Controls</h3>
            <div className="grid grid-cols-2 gap-2">
              {shortcuts
                .filter((s) => s.category === "other")
                .map((shortcut, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-semibold">{shortcut.key}</kbd>
                    <span>{shortcut.description}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">?</kbd> anywhere to open this dialog
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default KeyboardShortcutsModal
