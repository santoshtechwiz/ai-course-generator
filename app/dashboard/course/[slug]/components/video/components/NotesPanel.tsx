"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import neo from "@/components/neo/tokens"
import { StickyNote, Plus, Edit3, Trash2, Clock, Loader2 } from "lucide-react"
import { useNotes } from "@/hooks/use-notes"
import { NoteModal } from "../../modals/NoteModal"
import type { Bookmark } from "@prisma/client"

interface NotesPanelProps {
  courseId: number
  chapterId: number
  currentTime: number
  duration: number
  formatTime: (seconds: number) => string
  onSeekToTimestamp?: (time: number) => void
}

export function NotesPanel({
  courseId,
  chapterId,
  currentTime,
  duration,
  formatTime,
  onSeekToTimestamp
}: NotesPanelProps) {
  const { notes, deleteNote, loading } = useNotes({
    courseId,
    chapterId,
    limit: 5 // Limit to 5 notes
  })

  const [isAddingNote, setIsAddingNote] = useState(false)

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId)
    } catch (error) {
      console.error("Failed to delete note:", error)
    }
  }

  const handleSeekToTimestamp = (timestamp: number) => {
    if (onSeekToTimestamp) {
      onSeekToTimestamp(timestamp)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3 }}
      className="fixed lg:absolute top-0 right-0 bottom-16 z-30 w-full lg:w-64 xl:w-72 max-w-sm bg-black/70 lg:bg-black/70 backdrop-blur-sm lg:border-l border-white/10 flex flex-col shadow-lg lg:shadow-none"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Notes</h3>
          </div>
          <Badge variant="neutral" className={cn(neo.badge, "bg-green-500/30 text-green-300 border-green-500/50")}>
            {notes.length}
          </Badge>
        </div>

        <NoteModal
          courseId={courseId}
          chapterId={chapterId}
          trigger={
            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isAddingNote}>
              {isAddingNote ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </>
              )}
            </Button>
          }
          onLoadingChange={setIsAddingNote}
        />
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1 p-4">
        <AnimatePresence>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-8"
            >
              <div className="text-white/60">Loading notes...</div>
            </motion.div>
          ) : notes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8 space-y-3"
            >
              <div className="flex justify-center">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <StickyNote className="h-8 w-8 text-green-400/50" />
                </div>
              </div>
              <div>
                <p className="text-white/60 text-sm font-semibold text-green-200">No notes yet</p>
                <p className="text-white/40 text-xs mt-1">Create notes at specific timestamps to capture key points</p>
              </div>
              <div className="pt-2 border-t border-white/10 text-xs text-white/30">
                💡 Tip: Click "Add Note" above or press N to create a note at the current timestamp
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {notes.map((note: Bookmark & { timestamp?: number }, index: number) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      {note.timestamp && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => handleSeekToTimestamp(note.timestamp!)}
                            className="text-green-400 hover:text-green-300 underline"
                          >
                            {formatTime(note.timestamp)}
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <NoteModal
                        courseId={courseId}
                        chapterId={chapterId}
                        existingNote={note}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-white/60 hover:text-red-400 hover:bg-red-500/20"
                        onClick={() => handleDeleteNote(note.id.toString())}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                    {note.note}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </motion.div>
  )
}