"use client"

import { useEffect, useState } from 'react'
import { useDraftManagement, type Draft, type DraftType } from '@/hooks/useDraftManagement'
import { FileText, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

interface DraftRecoveryBannerProps {
  type: DraftType
  onRestore: (draft: Draft) => void
}

/**
 * DraftRecoveryBanner
 * 
 * Shows a banner when drafts are available for recovery
 */
export function DraftRecoveryBanner({ type, onRestore }: DraftRecoveryBannerProps) {
  const { listDrafts, deleteDraft } = useDraftManagement()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [dismissed, setDismissed] = useState(false)
  
  useEffect(() => {
    const availableDrafts = listDrafts(type)
    setDrafts(availableDrafts)
  }, [type, listDrafts])
  
  const handleRestore = (draft: Draft) => {
    onRestore(draft)
    setDismissed(true)
  }
  
  const handleDelete = (draftId: string) => {
    deleteDraft(draftId)
    setDrafts(prev => prev.filter(d => d.id !== draftId))
  }
  
  const handleDismiss = () => {
    setDismissed(true)
  }
  
  if (drafts.length === 0 || dismissed) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
      >
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">
              Saved Drafts Available
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              You have {drafts.length} saved {drafts.length === 1 ? 'draft' : 'drafts'}. Would you like to restore?
            </p>
            
            <div className="space-y-2">
              {drafts.map(draft => (
                <div
                  key={draft.id}
                  className="bg-white dark:bg-gray-800 rounded p-3 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {draft.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Saved {formatDistanceToNow(new Date(draft.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(draft.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRestore(draft)}
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
