import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { forceSyncSubscription, selectSubscriptionLoading } from '@/store/slices/subscription-slice'
import { logger } from '@/lib/logger'
import type { AppDispatch } from '@/store'

export function useSubscriptionSync() {
  const dispatch = useDispatch<AppDispatch>()
  const isLoading = useSelector(selectSubscriptionLoading)
  
  const forceSync = useCallback(async () => {
    try {
      logger.info('Force syncing subscription...')
      toast.loading('Syncing subscription data...', { id: 'subscription-sync' })
      
      const result = await dispatch(forceSyncSubscription())
      
      if (forceSyncSubscription.fulfilled.match(result)) {
        toast.success('Subscription data synced successfully!', { id: 'subscription-sync' })
        logger.info('Subscription sync completed successfully', result.payload)
        return result.payload
      } else {
        const error = result.payload || 'Failed to sync subscription'
        toast.error(`Sync failed: ${error}`, { id: 'subscription-sync' })
        logger.error('Subscription sync failed', error)
        throw new Error(error as string)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Sync failed: ${errorMessage}`, { id: 'subscription-sync' })
      logger.error('Subscription sync error', error)
      throw error
    }
  }, [dispatch])
  
  const checkSync = useCallback(async () => {
    try {
      // Simple check - just call the sync endpoint without updating UI
      const response = await fetch('/api/subscriptions/sync', {
        method: 'POST',
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.subscription
      }
      
      throw new Error(`Sync check failed: ${response.statusText}`)
    } catch (error) {
      logger.error('Subscription check failed', error)
      return null
    }
  }, [])
  
  return {
    forceSync,
    checkSync,
    isLoading,
  }
}

