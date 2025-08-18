"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import useSubscription from "@/hooks/use-subscription"

// This component should only be used in development
const SubscriptionTestPanel: React.FC = () => {
  const subscription = useSubscription()
  const [isExpanded, setIsExpanded] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null
  }

  const {
    subscriptionPlan,
    isSubscribed,
    canDownloadPdf,
    __debug
  } = subscription

  const handleReloadPage = () => {
    window.location.reload()
  }

  const copyTestFlags = () => {
    const flagsCode = `
// Add these flags to hooks/use-subscription.ts SUBSCRIPTION_TEST_FLAGS:
const SUBSCRIPTION_TEST_FLAGS = {
  SIMULATE_SUBSCRIBED_BUT_INACTIVE: ${__debug.testFlags.SIMULATE_SUBSCRIBED_BUT_INACTIVE},
  OVERRIDE_PLAN: ${__debug.testFlags.OVERRIDE_PLAN ? `"${__debug.testFlags.OVERRIDE_PLAN}"` : 'null'},
  OVERRIDE_STATUS: ${__debug.testFlags.OVERRIDE_STATUS ? `"${__debug.testFlags.OVERRIDE_STATUS}"` : 'null'},
  FORCE_PDF_DOWNLOAD: ${__debug.testFlags.FORCE_PDF_DOWNLOAD},
}
    `.trim()
    
    navigator.clipboard.writeText(flagsCode)
    alert("Test flags copied to clipboard!")
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">
              🧪 Subscription Test Panel
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? "−" : "+"}
            </Button>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-3">
            {/* Current State */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-orange-700 dark:text-orange-300">
                Current State:
              </Label>
              <div className="flex flex-wrap gap-1">
                <Badge variant={isSubscribed ? "default" : "secondary"}>
                  {isSubscribed ? "Subscribed" : "Not Subscribed"}
                </Badge>
                <Badge variant="outline">{subscriptionPlan}</Badge>
                <Badge variant={canDownloadPdf ? "default" : "destructive"}>
                  PDF: {canDownloadPdf ? "Allowed" : "Denied"}
                </Badge>
              </div>
            </div>

            {/* Debug Info */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-orange-700 dark:text-orange-300">
                Debug Info:
              </Label>
              <div className="text-xs bg-orange-100 dark:bg-orange-900/30 p-2 rounded font-mono">
                <div>Original Plan: {__debug.originalSubscription?.plan || "null"}</div>
                <div>Original Status: {__debug.originalSubscription?.status || "null"}</div>
                <div>Test Plan: {__debug.testSubscription?.plan || "null"}</div>
                <div>Test Status: {__debug.testSubscription?.status || "null"}</div>
                <div>Is Subscribed: {__debug.isSubscribedCalculation.finalIsSubscribed ? "true" : "false"}</div>
                <div>Can Download PDF: {__debug.canDownloadPdfCalculation.finalCanDownload ? "true" : "false"}</div>
              </div>
            </div>

            {/* Quick Test Scenarios */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-orange-700 dark:text-orange-300">
                Quick Test Scenarios:
              </Label>
              <div className="text-xs text-orange-600 dark:text-orange-400 mb-2">
                ⚠️ Requires code changes in use-subscription.ts
              </div>
              
              <div className="grid grid-cols-1 gap-1">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={copyTestFlags}
                  className="text-xs h-7"
                >
                  📋 Copy Current Flags
                </Button>
                
                <div className="text-xs space-y-1 text-orange-600 dark:text-orange-400">
                  <div><strong>Test Case 1:</strong> Set SIMULATE_SUBSCRIBED_BUT_INACTIVE: true</div>
                  <div><strong>Test Case 2:</strong> Set OVERRIDE_PLAN: "PREMIUM", OVERRIDE_STATUS: "inactive"</div>
                  <div><strong>Test Case 3:</strong> Set FORCE_PDF_DOWNLOAD: false</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleReloadPage}
                className="text-xs h-7 flex-1"
              >
                🔄 Reload Page
              </Button>
            </div>

            <div className="text-xs text-orange-600 dark:text-orange-400 border-t border-orange-200 dark:border-orange-800 pt-2">
              <strong>How to test:</strong><br/>
              1. Copy flags above<br/>
              2. Update SUBSCRIPTION_TEST_FLAGS in use-subscription.ts<br/>
              3. Reload page to see changes<br/>
              4. Test PDF download behavior
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default SubscriptionTestPanel
