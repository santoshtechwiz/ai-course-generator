// Services
export { default as bookmarkService } from "@/lib/bookmark-service"
export { default as noteService } from "@/lib/note-service"

// Hooks
export * from "@/hooks/use-bookmarks"
export * from "@/hooks/use-notes"

// Components
export { NotesPanel } from "@/components/notes/NotesPanel"

// Types
export type { BookmarkFilters, CreateBookmarkData, UpdateBookmarkData } from "@/lib/bookmark-service"
export type { NoteFilters, CreateNoteData, UpdateNoteData } from "@/lib/note-service"
