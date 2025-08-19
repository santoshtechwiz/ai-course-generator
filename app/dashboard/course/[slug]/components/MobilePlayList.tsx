"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Menu, BookOpen } from "lucide-react"

interface MobilePlayListProps {
  courseName: string
  onSidebarOpen: () => void
}

const MobilePlayList: React.FC<MobilePlayListProps> = ({ courseName, onSidebarOpen }) => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
            <h1 className="truncate text-base font-medium">{courseName}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarOpen}
            className="shrink-0 hover:bg-accent transition-colors rounded-lg"
            aria-label="Open course chapters"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default MobilePlayList
