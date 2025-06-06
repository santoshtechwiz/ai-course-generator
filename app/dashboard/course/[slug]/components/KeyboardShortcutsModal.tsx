import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Play,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize2,
  Monitor,
  PictureInPictureIcon as Picture,
  Bookmark,
  Settings,
} from "lucide-react"

interface KeyboardShortcutsModalProps {
  onClose: () => void
}

interface ShortcutItem {
  key: string
  description: string
  icon?: React.ReactNode
}

interface ShortcutCategory {
  title: string
  icon: React.ReactNode
  shortcuts: ShortcutItem[]
}

const shortcutCategories: ShortcutCategory[] = [
  {
    title: "Playback Controls",
    icon: <Play className="h-4 w-4" />,
    shortcuts: [
      { key: "Space / K", description: "Play/Pause", icon: <Play className="h-3 w-3" /> },
      { key: "← / J", description: "Rewind 10 seconds", icon: <SkipBack className="h-3 w-3" /> },
      { key: "→ / L", description: "Forward 10 seconds", icon: <SkipForward className="h-3 w-3" /> },
      { key: "Shift + ↑", description: "Skip forward 1 minute" },
      { key: "Shift + ↓", description: "Skip backward 1 minute" },
    ],
  },
  {
    title: "Audio Controls",
    icon: <Volume2 className="h-4 w-4" />,
    shortcuts: [
      { key: "M", description: "Mute/Unmute", icon: <VolumeX className="h-3 w-3" /> },
      { key: "↑", description: "Volume up", icon: <Volume2 className="h-3 w-3" /> },
      { key: "↓", description: "Volume down" },
    ],
  },
  {
    title: "Display Controls",
    icon: <Monitor className="h-4 w-4" />,
    shortcuts: [
      { key: "F", description: "Toggle fullscreen", icon: <Maximize2 className="h-3 w-3" /> },
      { key: "T", description: "Toggle theater mode", icon: <Monitor className="h-3 w-3" /> },
      { key: "P", description: "Picture-in-Picture", icon: <Picture className="h-3 w-3" /> },
    ],
  },
  {
    title: "Navigation & Features",
    icon: <Settings className="h-4 w-4" />,
    shortcuts: [
      { key: "0-9", description: "Jump to % of video" },
      { key: "?", description: "Show keyboard shortcuts" },
      { key: "B", description: "Add bookmark", icon: <Bookmark className="h-3 w-3" /> },
    ],
  },
]

export default function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>Use these keyboard shortcuts to control the video player efficiently.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shortcutCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="p-1.5 bg-muted rounded">{category.icon}</div>
                {category.title}
              </div>

              <div className="grid gap-2">
                {category.shortcuts.map((shortcut, shortcutIndex) => (
                  <div
                    key={shortcutIndex}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {shortcut.icon && <div className="text-muted-foreground">{shortcut.icon}</div>}
                      <span className="text-sm text-foreground">{shortcut.description}</span>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {shortcut.key}
                    </Badge>
                  </div>
                ))}
              </div>

              {categoryIndex < shortcutCategories.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Press{" "}
            <Badge variant="outline" className="mx-1 font-mono">
              ?
            </Badge>{" "}
            anytime to toggle this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
