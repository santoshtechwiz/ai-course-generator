"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useOwnership, useOwnerInfo } from "@/lib/ownership"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"

interface OwnershipDebugPanelProps {
  content: any
  title?: string
  className?: string
}

const OwnershipDebugPanel: React.FC<OwnershipDebugPanelProps> = ({
  content,
  title = "Content",
  className = ""
}) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const ownership = useOwnership(content)
  const ownerInfo = useOwnerInfo(content)

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null
  }

  if (!isVisible) {
    return (
      <div className={`fixed bottom-20 left-4 z-50 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
        >
          <Eye className="h-4 w-4 mr-1" />
          Owner Debug
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-20 left-4 z-50 w-80 ${className}`}>
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">
              🏠 Ownership Debug: {title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Ownership Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={ownership.isOwner ? "default" : "secondary"}>
                {ownership.isOwner ? "OWNER" : "NOT OWNER"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {ownership.confidence.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-1 text-xs">
            <div><strong>Current User:</strong> {ownership.currentUserId || "Not signed in"}</div>
            <div><strong>Content Owner:</strong> {ownership.ownerId || "Not found"}</div>
            <div><strong>Detection Method:</strong> {ownership.detectionMethod}</div>
          </div>

          {/* Permissions */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-purple-700 dark:text-purple-300">Permissions:</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <Badge variant={ownerInfo.canEdit ? "default" : "secondary"} className="text-xs">
                Edit: {ownerInfo.canEdit ? "✓" : "✗"}
              </Badge>
              <Badge variant={ownerInfo.canDelete ? "default" : "secondary"} className="text-xs">
                Delete: {ownerInfo.canDelete ? "✓" : "✗"}
              </Badge>
              <Badge variant={ownerInfo.canShare ? "default" : "secondary"} className="text-xs">
                Share: {ownerInfo.canShare ? "✓" : "✗"}
              </Badge>
              <Badge variant={ownerInfo.canDownload ? "default" : "secondary"} className="text-xs">
                Download: {ownerInfo.canDownload ? "✓" : "✗"}
              </Badge>
            </div>
          </div>

          {/* Debug Details */}
          {ownership.debug && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-purple-700 dark:text-purple-300">Debug:</div>
              <div className="text-xs bg-purple-100 dark:bg-purple-900/30 p-2 rounded font-mono">
                <div><strong>Checked Fields:</strong> {ownership.debug.checkedFields.join(", ")}</div>
                <div><strong>Found In:</strong> {ownership.debug.foundOwnerIn || "None"}</div>
                {ownership.debug.rawContent && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-purple-600">Raw Content</summary>
                    <pre className="mt-1 text-xs overflow-auto max-h-20">
                      {JSON.stringify(ownership.debug.rawContent, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
            <div className="text-xs text-purple-600 dark:text-purple-400">
              <strong>Quick Fix:</strong> If ownership is wrong, check that content has userId, ownerId, or createdBy field.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OwnershipDebugPanel
