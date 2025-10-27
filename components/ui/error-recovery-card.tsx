"use client"

import React from "react"
import { AlertTriangle, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ErrorRecoveryCardProps {
  error: {
    title: string
    message: string
    code?: string
    suggestions?: string[]
  }
  onRetry?: () => void
  onCancel?: () => void
  retryLabel?: string
  cancelLabel?: string
  showCancel?: boolean
  className?: string
}

export function ErrorRecoveryCard({
  error,
  onRetry,
  onCancel,
  retryLabel = "Try Again",
  cancelLabel = "Cancel",
  showCancel = true,
  className = "",
}: ErrorRecoveryCardProps) {
  return (
    <Card className={`border-destructive/50 bg-destructive/5 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {error.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error.message}
            {error.code && (
              <span className="block mt-1 text-xs opacity-75">
                Error code: {error.code}
              </span>
            )}
          </AlertDescription>
        </Alert>

        {error.suggestions && error.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Suggestions:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {error.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="default"
              size="sm"
              className="flex-1 font-black border-2 border-destructive text-destructive hover:bg-destructive hover:text-background rounded-none"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {retryLabel}
            </Button>
          )}
          {showCancel && onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              size="sm"
              className="flex-1 font-black border-2 border-border rounded-none"
            >
              <X className="h-4 w-4 mr-2" />
              {cancelLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}