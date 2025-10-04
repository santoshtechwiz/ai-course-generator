"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import { useAuth } from '@/modules/auth'
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'
import { SubscriptionService } from '@/services/subscription-services'

/**
 * Subscription Debug Panel
 * Shows current sync status and allows manual sync operations
 * Only visible in development mode
 */
export function SubscriptionDebugPanel() {
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const { user } = useAuth()
  const { subscription, forceSessionSync, refreshSubscription } = useUnifiedSubscription()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const checkSyncStatus = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/session/sync', {
        method: 'GET',
        credentials: 'include'
      })
      const data = await response.json()
      setSyncStatus(data)
    } catch (error) {
      console.error('Failed to check sync status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const triggerSync = async () => {
    setIsSyncing(true)
    try {
      await forceSessionSync()
      await checkSyncStatus() // Refresh status after sync
    } catch (error) {
      console.error('Manual sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const triggerSimpleSync = async () => {
    setIsSyncing(true)
    try {
      // Use centralized subscription service
      await SubscriptionService.getSubscriptionStatus(user?.id || '')
      await refreshSubscription()
      await checkSyncStatus()
    } catch (error) {
      console.error('Simple sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const clearBrowserCache = () => {
    // Simple browser cache clear
    if (typeof window !== 'undefined') {
      sessionStorage.clear()
      localStorage.removeItem('subscription-cache')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }

  const refreshSub = async () => {
    try {
      refreshSubscription()
      await checkSyncStatus()
    } catch (error) {
      console.error('Subscription refresh failed:', error)
    }
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 border-2 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          🔧 Subscription Debug Panel
          {syncStatus?.needsSync && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Out of Sync
            </Badge>
          )}
          {syncStatus && !syncStatus.needsSync && (
            <Badge variant="default" className="text-xs bg-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              In Sync
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <strong>Session:</strong>
            <div>Credits: {user?.credits || 0}</div>
            <div>Used: {user?.creditsUsed || 0}</div>
            <div>Available: {(user?.credits || 0) - (user?.creditsUsed || 0)}</div>
            <div>Plan: {user?.userType || 'N/A'}</div>
          </div>
          <div>
            <strong>Subscription:</strong>
            <div>Credits: {subscription?.credits || 0}</div>
            <div>Plan Credits: {syncStatus?.subscription?.planCredits || 'N/A'}</div>
            <div>Used: {subscription?.tokensUsed || 0}</div>
            <div>Plan: {subscription?.subscriptionPlan || 'N/A'}</div>
          </div>
        </div>

        {syncStatus?.debug && (
          <div className="text-xs space-y-1 bg-gray-100 dark:bg-gray-800 p-2 rounded">
            <div><strong>Debug Info:</strong></div>
            <div>DB Credits: {syncStatus.debug.userCredits}</div>
            <div>DB Used: {syncStatus.debug.userCreditsUsed}</div>
            <div>Plan Tokens: {syncStatus.debug.planTokens}</div>
            <div>User Type: {syncStatus.debug.userType}</div>
            <div>Plan ID: {syncStatus.debug.planId}</div>
          </div>
        )}

        {syncStatus && (
          <div className="text-xs space-y-1">
            <div><strong>Differences:</strong></div>
            <div>Credits: {syncStatus.differences?.credits || 0}</div>
            <div>Used: {syncStatus.differences?.used || 0}</div>
            {syncStatus.timestamp && (
              <div>Last Check: {new Date(syncStatus.timestamp).toLocaleTimeString()}</div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={checkSyncStatus}
            disabled={isChecking}
          >
            {isChecking && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
            Check Status
          </Button>
          
          <Button 
            size="sm" 
            onClick={triggerSync}
            disabled={isSyncing}
            variant={syncStatus?.needsSync ? "destructive" : "default"}
          >
            {isSyncing && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
            Force Sync
          </Button>
          
          <Button 
            size="sm" 
            variant="secondary"
            onClick={refreshSub}
          >
            Refresh Sub
          </Button>
        </div>
        
        {/* Simplified Sync Options */}
        <div className="flex gap-2 mt-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={triggerSimpleSync}
            disabled={isSyncing}
            className="flex-1"
          >
            <Zap className="w-3 h-3 mr-1" />
            Sync Now
          </Button>
          
          <Button 
            size="sm" 
            variant="destructive"
            onClick={clearBrowserCache}
            className="flex-1"
          >
            Clear & Reload
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default SubscriptionDebugPanel