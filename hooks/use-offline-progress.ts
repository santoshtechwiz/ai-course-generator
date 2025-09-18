"use client"

import { useState, useEffect, useCallback } from 'react'
import { OfflineProgressQueue } from '@/lib/queues/OfflineProgressQueue'

interface UseOfflineProgressOptions {
  onSyncComplete?: () => void
  onSyncError?: (error: Error) => void
  onStatusChange?: (status: ReturnType<typeof OfflineProgressQueue['prototype']['getQueueStatus']>) => void
}

export function useOfflineProgress(options: UseOfflineProgressOptions = {}) {
  const { onSyncComplete, onSyncError, onStatusChange } = options

  const [queueStatus, setQueueStatus] = useState(
    OfflineProgressQueue.getInstance().getQueueStatus()
  )

  // Update status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newStatus = OfflineProgressQueue.getInstance().getQueueStatus()
      setQueueStatus(newStatus)
      onStatusChange?.(newStatus)
    }, 1000)

    return () => clearInterval(interval)
  }, [onStatusChange])

  // Retry failed updates
  const retryFailedUpdates = useCallback(async () => {
    try {
      await OfflineProgressQueue.getInstance().retryFailedUpdates()
      const newStatus = OfflineProgressQueue.getInstance().getQueueStatus()
      setQueueStatus(newStatus)
      onStatusChange?.(newStatus)
    } catch (error) {
      console.error('Error retrying failed updates:', error)
      onSyncError?.(error as Error)
    }
  }, [onStatusChange, onSyncError])

  // Clear failed updates
  const clearFailedUpdates = useCallback(() => {
    OfflineProgressQueue.getInstance().clearFailedUpdates()
    const newStatus = OfflineProgressQueue.getInstance().getQueueStatus()
    setQueueStatus(newStatus)
    onStatusChange?.(newStatus)
  }, [onStatusChange])

  // Expose sync status and actions
  return {
    queueStatus,
    isOnline: queueStatus.isOnline,
    hasPendingUpdates: queueStatus.total > 0,
    hasFailedUpdates: queueStatus.failed > 0,
    retryFailedUpdates,
    clearFailedUpdates
  }
}

// Hook to manage offline status indicator UI
export function useOfflineIndicator() {
  const { queueStatus } = useOfflineProgress()
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    // Show indicator if offline or has pending updates
    const shouldShow = !queueStatus.isOnline || queueStatus.total > 0

    if (shouldShow !== showIndicator) {
      setShowIndicator(shouldShow)
    }
  }, [queueStatus, showIndicator])

  return {
    showIndicator,
    status: queueStatus,
    message: !queueStatus.isOnline
      ? "You're offline. Changes will sync when you reconnect."
      : queueStatus.total > 0
      ? `Syncing ${queueStatus.total} updates...`
      : ""
  }
}

export default useOfflineProgress