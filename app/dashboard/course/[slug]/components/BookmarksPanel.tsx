"use client"

// framer-motion removed for lightweight transitions
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bookmark as BookmarkIcon, Lock } from "lucide-react"
import { useState } from "react"
import type { FC } from "react"
import neo from "@/components/neo/tokens"
import { cn } from "@/lib/utils"
import type { BookmarkItem } from "@/store/slices/course-slice"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Props {
  bookmarks: BookmarkItem[]
  isAuthenticated: boolean
  handleSeekToBookmark: (time: number) => void
  handleRemoveBookmark: (id: string) => void
  formatTime: (seconds: number) => string
}

const BookmarksPanel: FC<Props> = ({ bookmarks, isAuthenticated, handleSeekToBookmark, handleRemoveBookmark, formatTime }) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleConfirmDelete = (id: string) => {
    handleRemoveBookmark(id)
    setConfirmDelete(null)
  }

  return (
    <Card className={neo.card}>
      <CardHeader className={neo.header}>
        <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
          <BookmarkIcon className="h-7 w-7 text-foreground" />
          Video Bookmarks
        </CardTitle>
        <CardDescription className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
          {bookmarks.length > 0 ? `${bookmarks.length} bookmark${bookmarks.length !== 1 ? "s" : ""} saved` : "Press 'B' to bookmark moments"}
        </CardDescription>
      </CardHeader>
  <CardContent className={neo.content}>
        {isAuthenticated && bookmarks.length > 0 ? (
            <div className="space-y-4">
            {bookmarks.map((bookmark, index) => (
              <div
                key={bookmark.id}
                onClick={() => handleSeekToBookmark(bookmark.time)}
                className={`group flex items-center justify-between p-5 bg-neo-background cursor-pointer hover:shadow-[6px_6px_0px_0px_var(--neo-border)] transition-shadow ${neo.inner}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 bg-neo-border flex items-center justify-center text-neo-background font-black text-xl ${neo.inner}`}>{index + 1}</div>
                    <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="default" className={cn(neo.badge, "bg-yellow-300 text-black uppercase text-base px-3 py-1")}>{formatTime(bookmark.time)}</Badge>
                    </div>
                    <p className="font-black text-foreground text-lg uppercase tracking-tight">{bookmark.title}</p>
                  </div>
                </div>
                <AlertDialog open={confirmDelete === bookmark.id} onOpenChange={(open) => !open && setConfirmDelete(null)}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(bookmark.id) }} 
                      className={`opacity-0 group-hover:opacity-100 transition-opacity ${neo.inner} hover:bg-red-500 hover:text-white font-black uppercase`}
                    >
                      Remove
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-4 border-[var(--color-border)] rounded-none shadow-[4px_4px_0_var(--shadow-color)]">
                    <AlertDialogTitle className="font-black uppercase text-lg">Delete Bookmark?</AlertDialogTitle>
                    <AlertDialogDescription className="text-base font-bold">
                      Remove "{bookmark.title}" bookmark? This action cannot be undone.
                    </AlertDialogDescription>
                    <div className="flex gap-3 justify-end mt-6">
                      <AlertDialogCancel className="border-2 border-[var(--color-border)] rounded-none font-black uppercase">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleConfirmDelete(bookmark.id)}
                        className="bg-[var(--color-error)] text-white border-2 border-[var(--color-border)] rounded-none font-black uppercase hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        ) : isAuthenticated ? (
          <div className="text-center py-16">
            <div className={`w-28 h-28 bg-muted flex items-center justify-center mx-auto mb-8 ${neo.inner}`}>
              <BookmarkIcon className="h-14 w-14 text-foreground" />
            </div>
            <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">No bookmarks yet</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-base font-bold">Press 'B' while watching to save important moments</p>
            <Badge variant="default" className={cn(neo.badge, "bg-neo-border text-neo-background text-lg px-6 py-3")}>Press B</Badge>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className={`w-28 h-28 bg-muted flex items-center justify-center mx-auto mb-8 ${neo.inner}`}>
              <Lock className="h-14 w-14 text-foreground" />
            </div>
            <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Sign in required</h3>
            <p className="text-muted-foreground mb-8 text-base font-bold">Create an account to save bookmarks</p>
            <Button className={`${neo.buttonPrimary} text-lg px-8 py-6`} size="lg">Sign In</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BookmarksPanel
