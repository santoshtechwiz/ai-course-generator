'use client'

import { useState, useRef, useEffect } from 'react'
import { Save, Edit3, Trash2, Clock, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Note {
  id: string
  timestamp: number
  content: string
  createdAt: Date
}

interface VideoNotesProps {
  videoId: string
  currentTime: number
  duration: number
}

export function VideoNotes({ videoId, currentTime, duration }: VideoNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [showAddNote, setShowAddNote] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(`video-notes-${videoId}`)
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    }
  }, [videoId])

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem(`video-notes-${videoId}`, JSON.stringify(notes))
  }, [notes, videoId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const addNote = () => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        timestamp: currentTime,
        content: newNote.trim(),
        createdAt: new Date()
      }
      setNotes([...notes, note])
      setNewNote('')
      setShowAddNote(false)
    }
  }

  const updateNote = (id: string, content: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, content } : note
    ))
    setIsEditing(null)
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id))
  }

  const jumpToTimestamp = (timestamp: number) => {
    // This would typically trigger a video seek
    // For now, we'll just log it
    console.log('Jump to timestamp:', timestamp)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isEditing) {
        updateNote(isEditing, newNote)
      } else {
        addNote()
      }
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Video Notes</h3>
        <button
          onClick={() => setShowAddNote(!showAddNote)}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Note</span>
        </button>
      </div>

      {/* Add Note Form */}
      {showAddNote && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">
              Note at {formatTime(currentTime)}
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add your note here..."
            className="w-full p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <div className="flex items-center justify-end space-x-2 mt-2">
            <button
              onClick={() => setShowAddNote(false)}
              className="px-3 py-1 text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={addNote}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No notes yet. Click "Add Note" to start taking notes!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => jumpToTimestamp(note.timestamp)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {formatTime(note.timestamp)}
                  </span>
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(note.id)
                      setNewNote(note.content)
                    }}
                    className="p-1 text-slate-500 hover:text-slate-700"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {isEditing === note.id ? (
                <div>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full p-2 border border-slate-300 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                  <div className="flex items-center justify-end space-x-2 mt-2">
                    <button
                      onClick={() => setIsEditing(null)}
                      className="px-2 py-1 text-slate-600 hover:text-slate-800 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => updateNote(note.id, newNote)}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-700 whitespace-pre-wrap">{note.content}</p>
              )}
              
              <div className="text-xs text-slate-500 mt-2">
                {note.createdAt.toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notes Summary */}
      {notes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
            <button
              onClick={() => {
                const notesText = notes
                  .map(note => `[${formatTime(note.timestamp)}] ${note.content}`)
                  .join('\n\n')
                navigator.clipboard.writeText(notesText)
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              Export Notes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}