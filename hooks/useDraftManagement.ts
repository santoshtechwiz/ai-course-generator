"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DraftType = 'quiz' | 'course' | 'other'

export interface Draft {
  id: string
  type: DraftType
  title: string
  data: Record<string, any>
  timestamp: number
  userId?: string
  autoSaved: boolean
}

interface DraftState {
  drafts: Draft[]
  
  // Actions
  saveDraft: (draft: Omit<Draft, 'id' | 'timestamp'>) => string
  updateDraft: (id: string, data: Partial<Draft>) => void
  getDraft: (id: string) => Draft | undefined
  deleteDraft: (id: string) => void
  listDrafts: (type?: DraftType) => Draft[]
  clearOldDrafts: (olderThanDays?: number) => void
}

export const useDraftManagement = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: [],

      saveDraft: (draft) => {
        const id = `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newDraft: Draft = {
          ...draft,
          id,
          timestamp: Date.now(),
          autoSaved: true
        }
        
        set((state) => ({
          drafts: [...state.drafts, newDraft]
        }))
        
        console.log(`[DraftManagement] Saved draft: ${id} (${draft.type})`)
        return id
      },

      updateDraft: (id, data) => {
        set((state) => ({
          drafts: state.drafts.map(draft =>
            draft.id === id
              ? { ...draft, ...data, timestamp: Date.now() }
              : draft
          )
        }))
        console.log(`[DraftManagement] Updated draft: ${id}`)
      },

      getDraft: (id) => {
        return get().drafts.find(draft => draft.id === id)
      },

      deleteDraft: (id) => {
        set((state) => ({
          drafts: state.drafts.filter(draft => draft.id !== id)
        }))
        console.log(`[DraftManagement] Deleted draft: ${id}`)
      },

      listDrafts: (type) => {
        const drafts = get().drafts
        if (type) {
          return drafts.filter(draft => draft.type === type)
        }
        return drafts
      },

      clearOldDrafts: (olderThanDays = 30) => {
        const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)
        set((state) => ({
          drafts: state.drafts.filter(draft => draft.timestamp > cutoffTime)
        }))
        console.log(`[DraftManagement] Cleared drafts older than ${olderThanDays} days`)
      }
    }),
    {
      name: 'draft-storage',
      version: 1
    }
  )
)

/**
 * useAutoSave Hook
 * 
 * Automatically saves form data as draft every 30 seconds
 */
export function useAutoSave(
  type: DraftType,
  title: string,
  getData: () => Record<string, any>,
  enabled: boolean = true
) {
  const { saveDraft, updateDraft } = useDraftManagement()
  
  // Auto-save implementation would go here
  // This is a placeholder for the actual implementation
  // In real usage, you'd use useEffect with setInterval
  
  return {
    saveDraft: () => {
      if (!enabled) return null
      
      const data = getData()
      const draftId = saveDraft({
        type,
        title,
        data,
        autoSaved: true
      })
      
      return draftId
    },
    
    updateDraft: (id: string) => {
      if (!enabled) return
      
      const data = getData()
      updateDraft(id, { data, timestamp: Date.now() })
    }
  }
}
