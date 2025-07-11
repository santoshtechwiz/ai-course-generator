"use client"

import * as React from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, AlertTriangle, Info, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export interface TokenUsage {
  used: number
  available: number
  remaining: number
  percentage: number
}

export interface QuizInfo {
  type: string
  count?: number
  difficulty?: string
  topic?: string
  estimatedTokens?: number
}

export interface ConfirmDialogProps {
  trigger?: React.ReactNode
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  children?: React.ReactNode
  isOpen?: boolean
  showTokenUsage?: boolean
  tokenUsage?: TokenUsage
  quizInfo?: QuizInfo
  status?: 'idle' | 'loading' | 'success' | 'error'
  errorMessage?: string
}

export function ConfirmDialog({
  trigger,
  onConfirm,
  onCancel,
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  children,
  isOpen,
  showTokenUsage = false,
  tokenUsage,
  quizInfo,
  status = 'idle',
  errorMessage,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const isControlled = typeof isOpen === "boolean"
  const open = isControlled ? isOpen : internalOpen
  const setOpen = isControlled ? (v: boolean) => (v ? undefined : onCancel?.()) : setInternalOpen

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      if (!isControlled) setInternalOpen(false)
    } catch (error) {
      console.error("Error during confirmation:", error)
    } finally {
      setLoading(false)
    }
  }

  const isLoading = loading || status === 'loading'
  const isSuccess = status === 'success'
  const isError = status === 'error'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isError && <AlertTriangle className="w-5 h-5 text-destructive mr-2" />}
            {isSuccess && <Check className="w-5 h-5 text-green-500 mr-2" />}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {children}

          {quizInfo && (
            <div className="bg-muted/50 p-3 rounded-md space-y-2">
              <div className="flex items-center text-sm font-medium">
                <Info className="w-4 h-4 mr-2" />
                Quiz Information
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Type:</div>
                <div className="font-medium">{quizInfo.type}</div>
                
                {quizInfo.topic && (
                  <>
                    <div className="text-muted-foreground">Topic:</div>
                    <div className="font-medium">{quizInfo.topic}</div>
                  </>
                )}
                
                {quizInfo.count !== undefined && (
                  <>
                    <div className="text-muted-foreground">Count:</div>
                    <div className="font-medium">{quizInfo.count}</div>
                  </>
                )}
                
                {quizInfo.difficulty && (
                  <>
                    <div className="text-muted-foreground">Difficulty:</div>
                    <div className="font-medium capitalize">
                      <Badge variant="outline">{quizInfo.difficulty}</Badge>
                    </div>
                  </>
                )}
                
                {quizInfo.estimatedTokens !== undefined && (
                  <>
                    <div className="text-muted-foreground">Est. Tokens:</div>
                    <div className="font-medium">~{quizInfo.estimatedTokens}</div>
                  </>
                )}
              </div>
            </div>
          )}

          {showTokenUsage && tokenUsage && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Token Usage</span>
                <span className="font-medium">
                  {tokenUsage.used} / {tokenUsage.available}
                </span>
              </div>
              <Progress 
                value={tokenUsage.percentage} 
                className={cn(
                  "h-2",
                  tokenUsage.percentage > 80 ? "bg-amber-100" : "",
                  tokenUsage.percentage > 95 ? "bg-red-100" : ""
                )}
              />
              <p className="text-xs text-muted-foreground">
                {tokenUsage.remaining} tokens remaining
              </p>
            </div>
          )}

          <AnimatePresence>
            {isError && errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-destructive/10 text-destructive p-3 rounded-md text-sm"
              >
                {errorMessage}
              </motion.div>
            )}

            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-green-100 text-green-800 p-3 rounded-md text-sm"
              >
                Quiz created successfully!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading || isSuccess}
            className={cn(
              "relative",
              isSuccess ? "bg-green-600 hover:bg-green-700" : ""
            )}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Processing..." : isSuccess ? "Success!" : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
