import React, { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import cn from 'classnames'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,

} from '@/components/ui/tooltip'
import { Loader2 } from 'lucide-react'
import { ShieldAlert, Shield, Star, Trash2 } from 'lucide-react'
import { AlertDialogHeader, AlertDialogFooter } from '@/components/ui/alert-dialog'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from '@radix-ui/react-alert-dialog'
import useCourseActions from '@/hooks/useCourseActions'

// Updated ActionButton component
function ActionButton({ 
  onClick, 
  isLoading, 
  icon: Icon, 
  activeIcon: ActiveIcon, 
  label, 
  activeLabel, 
  isActive, 
  activeClass, 
  inactiveClass 
}: {
  onClick: () => void
  isLoading: boolean
  icon: React.ElementType
  activeIcon: React.ElementType
  label: string
  activeLabel: string
  isActive: boolean
  activeClass: string
  inactiveClass: string
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2 rounded-md transition-all",
        isActive ? activeClass : inactiveClass
      )}
      onClick={onClick}
      disabled={isLoading}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <motion.div
            key={isActive ? 'active' : 'inactive'}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            {isActive ? <ActiveIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            <span className="hidden sm:inline text-sm font-medium">{isActive ? activeLabel : label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}


// Updated CourseActions component
interface CourseActionsProps {
  slug: string
}



export default function CourseActions({ slug }: CourseActionsProps) {
  const { status, loading, handleAction } = useCourseActions({ slug })

  const handlePrivacyToggle = useCallback(() => handleAction('privacy'), [handleAction])
  const handleFavoriteToggle = useCallback(() => handleAction('favorite'), [handleAction])
  const handleDelete = useCallback(() => handleAction('delete'), [handleAction])

  return (
    <TooltipProvider>
      <div className="flex flex-row items-center justify-end gap-2 sm:gap-4 p-2 sm:p-4 rounded-lg bg-card">
        {/* Privacy Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <ActionButton
              onClick={handlePrivacyToggle}
              isLoading={loading === 'privacy'}
              icon={ShieldAlert}
              activeIcon={Shield}
              label="Private"
              activeLabel="Public"
              isActive={status.isPublic}
              activeClass="bg-green-50 text-green-600 hover:bg-green-100"
              inactiveClass="bg-red-50 text-red-600 hover:bg-red-100"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Toggle course privacy</p>
          </TooltipContent>
        </Tooltip>

        {/* Favorite Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <ActionButton
              onClick={handleFavoriteToggle}
              isLoading={loading === 'favorite'}
              icon={Star}
              activeIcon={Star}
              label="Favorite"
              activeLabel="Favorited"
              isActive={status.isFavorite}
              activeClass="bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
              inactiveClass="bg-muted text-muted-foreground hover:bg-muted/80"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{status.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-auto gap-2 px-4 py-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <Trash2 className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Delete</span>
            </motion.button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Course?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your course and all its content. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={loading === 'delete'}
                className="bg-destructive hover:bg-destructive/90"
              >
                {loading === 'delete' ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}

