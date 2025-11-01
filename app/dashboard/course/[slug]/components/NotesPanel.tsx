"use client"

// framer-motion removed for lightweight transitions
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { StickyNote, Clock, Edit3, Lock } from "lucide-react"
import { NoteModal } from "./modals/NoteModal"
import { DeleteNoteDialog } from "./modals/DeleteNoteDialog"
import type { FC } from "react"
import neo from "@/components/neo/tokens"
import type { Bookmark } from "@prisma/client"

interface Props {
  filteredNotes: Bookmark[]
  isAuthenticated: boolean
  notesSearchQuery: string
  setNotesSearchQuery: (v: string) => void
  notesFilter: "all" | "recent" | "chapter"
  setNotesFilter: (v: "all" | "recent" | "chapter") => void
  deleteNote: (id: string) => Promise<void>
  courseId: number
  currentChapterId?: number | undefined
}

const NotesPanel: FC<Props> = ({ filteredNotes, isAuthenticated, notesSearchQuery, setNotesSearchQuery, notesFilter, setNotesFilter, deleteNote, courseId, currentChapterId }) => {
  return (
    <Card className={neo.card}>
      <CardHeader className={neo.header}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-foreground">
              <StickyNote className="h-7 w-7 text-primary" />
              Course Notes
            </CardTitle>
            <CardDescription className="text-sm font-bold text-muted-foreground uppercase tracking-tight mt-2">
              {filteredNotes.length > 0 ? `${filteredNotes.length} note${filteredNotes.length !== 1 ? "s" : ""} ${notesSearchQuery || notesFilter !== "all" ? "found" : "saved"}` : "Track important insights"}
            </CardDescription>
          </div>
          <NoteModal 
            courseId={courseId} 
            chapterId={currentChapterId} 
            trigger={
              <Button 
                size="lg" 
                className={`${neo.buttonPrimary} px-6 font-black uppercase tracking-wider hover:scale-105 transition-transform`}
              >
                <span className="mr-2 text-lg">+</span>
                Add Note
              </Button>
            } 
          />
        </div>

        {isAuthenticated && filteredNotes.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6">
              <div className="relative flex-1 max-w-md">
              <Input 
                placeholder="Search notes..." 
                value={notesSearchQuery} 
                onChange={(e) => setNotesSearchQuery(e.target.value)} 
                className={`pl-12 font-bold h-12 text-base bg-background border-border text-foreground ${neo.inner}`} 
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={notesFilter === "all" ? "default" : "outline"} 
                size="lg" 
                onClick={() => setNotesFilter("all")} 
                className={`text-sm font-black uppercase ${neo.inner} ${notesFilter === "all" ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}
              >
                All
              </Button>
              <Button 
                variant={notesFilter === "recent" ? "default" : "outline"} 
                size="lg" 
                onClick={() => setNotesFilter("recent")} 
                className={`text-sm font-black uppercase ${neo.inner} ${notesFilter === "recent" ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}
              >
                Recent
              </Button>
              <Button 
                variant={notesFilter === "chapter" ? "default" : "outline"} 
                size="lg" 
                onClick={() => setNotesFilter("chapter")} 
                className={`text-sm font-black uppercase ${neo.inner} ${notesFilter === "chapter" ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}
              >
                Chapter
              </Button>
            </div>
          </div>
        )}
    </CardHeader>
      <CardContent className={neo.content}>
        {isAuthenticated && filteredNotes.length > 0 ? (
          <ScrollArea className="h-[600px] pr-4 custom-scrollbar">
            <div className="space-y-4">
              {filteredNotes.map((note, index) => (
                <div
                  key={note.id}
                  className={`group p-5 bg-card border-2 border-border hover:shadow-neo transition-all ${neo.inner}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 bg-success/20 border-2 border-border flex items-center justify-center ${neo.inner}`}>
                          <StickyNote className="h-6 w-6 text-success" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-black text-foreground mb-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="uppercase">{new Date(note.createdAt).toLocaleDateString()}</span>
                            {(note as any).chapter && (
                              <>
                                <Separator orientation="vertical" className="h-4 bg-border" />
                                <span className="truncate uppercase text-muted-foreground">{(note as any).chapter.title}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`bg-warning/10 border-2 border-warning/30 p-4 ${neo.inner}`}>
                        <p className="text-foreground whitespace-pre-wrap text-base font-bold leading-relaxed">{note.note}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <NoteModal 
                        courseId={courseId} 
                        chapterId={currentChapterId} 
                        existingNote={note as any} 
                        trigger={
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-10 w-10 p-0 hover:bg-secondary/20 hover:border-secondary font-black ${neo.inner}`}
                          >
                            <Edit3 className="h-5 w-5 text-secondary" />
                          </Button>
                        } 
                      />
                      <DeleteNoteDialog 
                        noteId={note.id.toString()} 
                        noteContent={note.note || ""} 
                        onDelete={() => Promise.resolve(deleteNote(note.id.toString()))} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : isAuthenticated ? (
          <div className="text-center py-16">
            <div className={`w-28 h-28 bg-muted flex items-center justify-center mx-auto mb-8 ${neo.inner}`}>
              <StickyNote className="h-14 w-14 text-foreground" />
            </div>
            <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">{notesSearchQuery || notesFilter !== "all" ? "No notes found" : "No notes yet"}</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-base font-bold">{notesSearchQuery || notesFilter !== "all" ? "Try adjusting your search" : "Start taking notes to capture insights"}</p>
            {!notesSearchQuery && notesFilter === "all" && (
              <NoteModal courseId={courseId} chapterId={currentChapterId} trigger={<Button className={`${neo.buttonPrimary} text-lg px-8 py-6`} size="lg"><StickyNote className="h-6 w-6 mr-3" />Create Note</Button>} />
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className={`w-28 h-28 bg-muted flex items-center justify-center mx-auto mb-8 ${neo.inner}`}>
              <Lock className="h-14 w-14 text-foreground" />
            </div>
            <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Sign in required</h3>
            <p className="text-muted-foreground mb-8 text-base font-bold">Create an account to save notes</p>
            <Button className={`${neo.buttonPrimary} text-lg px-8 py-6`} size="lg">Sign In</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default NotesPanel
