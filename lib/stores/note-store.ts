/**
 * Global Notes Store - handles notes state management with optimistic updates
 */

import { create } from "zustand"
import type { Note, NotePayload, NoteFilters } from "@/types/notes"

interface NoteState {
  // State
  notes: Map<string, Note[]>
  cache: Map<string, boolean>
  isLoading: boolean
  error: Error | null

  // Actions
  addNote: (key: string, note: Note) => void
  updateNote: (key: string, noteId: string, updates: Partial<Note>) => void
  deleteNote: (key: string, noteId: string) => void
  setNotes: (key: string, notes: Note[]) => void
  clearCache: () => void

  // Async operations
  fetchNotes: (key: string, filters?: NoteFilters) => Promise<Note[]>
  createNote: (key: string, data: NotePayload) => Promise<Note>
  updateNoteAsync: (key: string, noteId: string, updates: Partial<Note>) => Promise<Note>
  deleteNoteAsync: (key: string, noteId: string) => Promise<void>
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: new Map(),
  cache: new Map(),
  isLoading: false,
  error: null,

  addNote: (key, note) => {
    set(state => {
      const newNotes = new Map(state.notes)
      const existing = newNotes.get(key) || []
      newNotes.set(key, [note, ...existing])
      return { notes: newNotes }
    })
  },

  updateNote: (key, noteId, updates) => {
    set(state => {
      const newNotes = new Map(state.notes)
      const existing = newNotes.get(key) || []
      const updated = existing.map(note => 
        note.id === noteId ? { ...note, ...updates } : note
      )
      newNotes.set(key, updated)
      return { notes: newNotes }
    })
  },

  deleteNote: (key, noteId) => {
    set(state => {
      const newNotes = new Map(state.notes)
      const existing = newNotes.get(key) || []
      newNotes.set(key, existing.filter(note => note.id !== noteId))
      return { notes: newNotes }
    })
  },

  setNotes: (key, notes) => {
    set(state => {
      const newNotes = new Map(state.notes)
      newNotes.set(key, notes)
      return { notes: newNotes }
    })
  },

  clearCache: () => {
    set({ notes: new Map(), cache: new Map() })
  },

  fetchNotes: async (key, filters = {}) => {
    const state = get()
    const cached = state.notes.get(key)
    if (cached) return cached

    set({ isLoading: true })
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v.toString())
      })

      const response = await fetch(`/api/notes?${params.toString()}`)
      const { notes } = await response.json()
      state.setNotes(key, notes)
      return notes
    } catch (error) {
      set({ error: error as Error })
      return []
    } finally {
      set({ isLoading: false })
    }
  },

  createNote: async (key, data) => {
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      const note = await response.json()
      get().addNote(key, note)
      return note
    } catch (error) {
      set({ error: error as Error })
      throw error
    }
  },

  updateNoteAsync: async (key, noteId, updates) => {
    // Optimistic update
    get().updateNote(key, noteId, updates)

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      })

      const updated = await response.json()
      // Update with server response
      get().updateNote(key, noteId, updated)
      return updated
    } catch (error) {
      // Revert on failure
      const state = get()
      const notes = state.notes.get(key) || []
      const original = notes.find(n => n.id === noteId)
      if (original) {
        state.updateNote(key, noteId, original)
      }
      set({ error: error as Error })
      throw error
    }
  },

  deleteNoteAsync: async (key, noteId) => {
    // Optimistic delete
    const state = get()
    const notes = state.notes.get(key) || []
    const deleted = notes.find(n => n.id === noteId)
    state.deleteNote(key, noteId)

    try {
      await fetch(`/api/notes/${noteId}`, {
        method: "DELETE"
      })
    } catch (error) {
      // Revert on failure
      if (deleted) {
        state.addNote(key, deleted)
      }
      set({ error: error as Error })
      throw error
    }
  }
}))