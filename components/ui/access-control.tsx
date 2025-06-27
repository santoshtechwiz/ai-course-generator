"use client"

import React from 'react'
import { Lock, Sparkles } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent } from './card'

interface AccessControlProps {
  /**
   * Whether the user has access to the content
   */
  hasAccess: boolean
  
  /**
   * The content to display if the user has access
   */
  children: React.ReactNode
  
  /**
   * Optional custom component to display if the user doesn't have access
   */
  fallback?: React.ReactNode
  
  /**
   * The title of the feature (used in default fallback)
   */
  featureTitle?: string
  
  /**
   * Whether to show a preview of the content
   */
  showPreview?: boolean
  
  /**
   * Optional preview content if showPreview is true
   */
  previewContent?: React.ReactNode
}

/**
 * A reusable component that controls access to premium content
 * Handles its own fallback UI if the user doesn't have access
 */
export function AccessControl({
  hasAccess,
  children,
  fallback,
  featureTitle = 'Premium Feature',
  showPreview = false,
  previewContent
}: AccessControlProps) {
  // If user has access, show the full content
  if (hasAccess) {
    return <>{children}</>
  }
  
  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>
  }
  
  // Default fallback UI with optional preview
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        {showPreview && previewContent && (
          <div className="mb-6 w-full opacity-70 blur-[2px] pointer-events-none">
            {previewContent}
          </div>
        )}
        
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{featureTitle}</h3>
        <p className="text-muted-foreground mb-6">
          Upgrade to access this premium feature and unlock all content.
        </p>
        
        <Button onClick={() => window.location.href = "/dashboard/subscription"} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  )
}
