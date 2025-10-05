"use client"

import React, { useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Crown, LogIn, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { SignInPrompt } from "@/app/auth/signin/components/SignInPrompt"

type ModalType = "sign-in" | "upgrade" | "info"

interface UnifiedModalProps {
  /** Type of modal to display */
  type: ModalType
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal is closed */
  onClose: () => void
  /** Optional custom title (overrides default) */
  title?: string
  /** Optional custom description (overrides default) */
  description?: string
  /** Optional custom action text */
  actionText?: string
  /** Optional action handler */
  onAction?: () => void
  /** Optional callback URL for sign-in */
  callbackUrl?: string
  /** Optional additional content */
  children?: React.ReactNode
  /** Plan to upgrade to (for upgrade modal) */
  targetPlan?: string
}

const defaultContent: Record<ModalType, { title: string; description: string; icon: React.ReactNode; actionText: string }> = {
  "sign-in": {
    title: "Sign in Required",
    description: "Please sign in to access this feature and continue your learning journey.",
    icon: <LogIn className="h-6 w-6" />,
    actionText: "Sign In"
  },
  "upgrade": {
    title: "Upgrade to Premium",
    description: "Unlock all features and content with a premium subscription.",
    icon: <Crown className="h-6 w-6" />,
    actionText: "Upgrade Now"
  },
  "info": {
    title: "Information",
    description: "Here's some information you might find helpful.",
    icon: <Info className="h-6 w-6" />,
    actionText: "Got it"
  }
}

/**
 * Unified Modal Component
 * 
 * A single modal component that handles all modal contexts in the app:
 * - Sign-in prompts
 * - Upgrade prompts
 * - Info dialogs
 * 
 * Features:
 * - Consistent design and behavior
 * - Proper z-index layering
 * - Keyboard accessibility (ESC to close)
 * - Focus trap for screen readers
 * - Backdrop blur effect
 * - Responsive on all screen sizes
 */
export function UnifiedModal({
  type,
  isOpen,
  onClose,
  title,
  description,
  actionText,
  onAction,
  callbackUrl = "/dashboard",
  children,
  targetPlan
}: UnifiedModalProps) {
  const content = defaultContent[type]
  const displayTitle = title || content.title
  const displayDescription = description || content.description
  const displayActionText = actionText || content.actionText

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          // Container
          "max-w-lg mx-auto p-0 overflow-hidden",
          // Z-index for modal layer
          "z-[9999]",
          // Backdrop blur
          "backdrop-blur-md",
          // Rounded corners and shadow
          "rounded-2xl shadow-xl",
          // Border
          "border border-border/50",
          // Focus styles
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unified-modal-title"
        aria-describedby="unified-modal-description"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              type === "sign-in" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
              type === "upgrade" && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
              type === "info" && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            )}>
              {content.icon}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle id="unified-modal-title" className="text-lg font-semibold text-foreground">
                {displayTitle}
              </DialogTitle>
              {displayDescription && (
                <DialogDescription id="unified-modal-description" className="text-sm text-muted-foreground mt-1">
                  {displayDescription}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-4">
          {children ? (
            children
          ) : type === "sign-in" ? (
            <SignInPrompt callbackUrl={callbackUrl} />
          ) : type === "upgrade" ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200/50 dark:border-amber-800/50">
                <h4 className="font-medium text-sm mb-2 text-foreground">Premium Features</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Unlimited access to all courses
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Unlimited quiz attempts
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Ad-free experience
                  </li>
                </ul>
              </div>
              {targetPlan && (
                <p className="text-xs text-center text-muted-foreground">
                  Upgrading to <span className="font-semibold text-foreground">{targetPlan}</span> plan
                </p>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {displayDescription}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50 flex-row gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onAction || onClose}
            className={cn(
              "flex-1",
              type === "upgrade" && "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            )}
          >
            {displayActionText}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[9998]",
          "bg-black/40 backdrop-blur-md",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
    </Dialog>
  )
}

/**
 * Hook for managing unified modal state
 * 
 * Usage:
 * ```tsx
 * const modal = useUnifiedModal()
 * 
 * // Show sign-in modal
 * modal.showSignIn()
 * 
 * // Show upgrade modal
 * modal.showUpgrade("PREMIUM")
 * 
 * // Show info modal
 * modal.showInfo("Custom title", "Custom description")
 * ```
 */
export function useUnifiedModal() {
  const [state, setState] = React.useState<{
    isOpen: boolean
    type: ModalType
    title?: string
    description?: string
    targetPlan?: string
    onAction?: () => void
  }>({
    isOpen: false,
    type: "info"
  })

  const close = React.useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }))
  }, [])

  const showSignIn = React.useCallback((callbackUrl?: string) => {
    setState({
      isOpen: true,
      type: "sign-in",
      onAction: () => {
        // Handle sign-in action
        close()
      }
    })
  }, [close])

  const showUpgrade = React.useCallback((targetPlan?: string, onAction?: () => void) => {
    setState({
      isOpen: true,
      type: "upgrade",
      targetPlan,
      onAction: onAction || (() => {
        // Default: navigate to subscription page
        window.location.href = "/dashboard/subscription"
      })
    })
  }, [])

  const showInfo = React.useCallback((title?: string, description?: string) => {
    setState({
      isOpen: true,
      type: "info",
      title,
      description
    })
  }, [])

  return {
    ...state,
    close,
    showSignIn,
    showUpgrade,
    showInfo,
    Modal: (props: Partial<UnifiedModalProps>) => (
      <UnifiedModal
        {...state}
        {...props}
        isOpen={state.isOpen}
        onClose={close}
      />
    )
  }
}
