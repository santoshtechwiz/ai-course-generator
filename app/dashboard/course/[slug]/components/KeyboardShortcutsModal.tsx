import React, { useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface KeyboardShortcutsModalProps {
  onClose: () => void;
  show: boolean; // Add missing prop
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose, show }) => {
  // Use ref for focus management
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the close button when the modal opens
  useEffect(() => {
    if (show) {
      // Small delay to ensure the modal is rendered
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [show]);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [show, onClose]);

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="fixed left-[50%] max-h-[70vh] max-w-[600px] overflow-auto top-[50%] translate-x-[-50%] translate-y-[-50%]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            These shortcuts make navigating and controlling the video player easier.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium text-sm">Global</h4>
            <div className="space-y-1">
              <div className="flex items-center">
                <div className="text-xs text-muted-foreground text-center">
                  <Badge variant="outline" className="mx-1 font-normal">
                    Press
                  </Badge>
                  <Badge variant="outline" className="mx-1 font-normal">
                    ?
                  </Badge>
                  <Badge variant="outline" className="mx-1 font-normal">
                    or Shift + /
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Show shortcuts</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-medium text-sm">Player Controls</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Space</p>
                <p className="text-xs text-muted-foreground">Play / Pause</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">F</p>
                <p className="text-xs text-muted-foreground">Fullscreen</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">T</p>
                <p className="text-xs text-muted-foreground">Theater Mode</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">ESC</p>
                <p className="text-xs text-muted-foreground">Exit Theater / Fullscreen</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">P</p>
                <p className="text-xs text-muted-foreground">Picture-in-Picture</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">M</p>
                <p className="text-xs text-muted-foreground">Mute / Unmute</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">B</p>
                <p className="text-xs text-muted-foreground">Add Bookmark</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Shift + B</p>
                <p className="text-xs text-muted-foreground">Toggle Bookmarks</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">N</p>
                <p className="text-xs text-muted-foreground">Add Note</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Shift + N</p>
                <p className="text-xs text-muted-foreground">Toggle Notes</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">← / →</p>
                <div>
                  <p className="text-xs text-muted-foreground">Skip Back / Forward</p>
                  <p className="text-xs text-muted-foreground">(10 seconds)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button ref={closeButtonRef} variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default KeyboardShortcutsModal
