"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SignInPrompt } from "@/app/auth/signin/components/SignInPrompt"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  callbackUrl: string
}

export function AuthModal({ isOpen, onClose, title, description, callbackUrl }: AuthModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4">
          <SignInPrompt callbackUrl={callbackUrl} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
