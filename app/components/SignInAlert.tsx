"use client"

import React from 'react'
import { useSession } from 'next-auth/react'
import { AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SignInAlertProps {
  onSignIn: () => Promise<void>
  saveFormData: () => void
  children: React.ReactNode
}

export function SignInAlert({ onSignIn, saveFormData, children }: SignInAlertProps) {
  const { status } = useSession()
  const [showDialog, setShowDialog] = React.useState(false)

  const handleSignIn = async () => {
    saveFormData()
    await onSignIn()
    setShowDialog(false)
  }

  if (status === 'authenticated') {
    return <>{children}</>
  }

  return (
    <>
      <Alert variant="warning" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not signed in</AlertTitle>
        <AlertDescription>
          You need to be signed in to create a quiz or course.
        </AlertDescription>
      </Alert>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button
            onClick={() => setShowDialog(true)}
            className="w-full"
          >
            Sign In to Create
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              You need to sign in to create a quiz or course. Your current progress will be saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleSignIn}>Sign In</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
