import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface KeyboardShortcutsModalProps {
  onClose: () => void
}

export default function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Use these keyboard shortcuts to control the video player.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Playback Controls</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Play/Pause</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">Space</kbd>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Skip Forward</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">→</kbd>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Skip Backward</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">←</kbd>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Volume Up</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">↑</kbd>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Volume Down</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">↓</kbd>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm">Additional Controls</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mute/Unmute</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">M</kbd>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fullscreen</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">F</kbd>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Theater Mode</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">T</kbd>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Jump to %</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">0-9</kbd>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Show Shortcuts</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">?</kbd>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
