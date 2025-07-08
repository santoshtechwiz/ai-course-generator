'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { 
  forceSyncSubscription, 
  selectSubscriptionData, 
  selectSubscriptionLoading 
} from '@/store/slices/subscription-slice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { OptimizedVideoPlayer } from '@/components/features/OptimizedVideoPlayer'
import { AppDispatch } from '@/store'

/**
 * Demonstrates how to use OptimizedVideoPlayer with the subscription slice
 * while avoiding timeouts
 */
export function SubscriptionVideoDemo() {
  const dispatch = useDispatch<AppDispatch>()
  const subscription = useSelector(selectSubscriptionData)
  const isLoadingSubscription = useSelector(selectSubscriptionLoading)
  const [videoChapterId, setVideoChapterId] = useState<number | null>(null)
  
  // Optional: Load subscription data if needed
  useEffect(() => {
    // Only dispatch if we don't have data yet
    if (!subscription && !isLoadingSubscription) {
      dispatch(forceSyncSubscription())
    }
  }, [dispatch, subscription, isLoadingSubscription])
  
  // Simulated function to get video content
  const loadVideoContent = async () => {
    try {
      // Generate a "random" chapter ID for demo purposes
      const chapterId = Math.floor(Math.random() * 10) + 100
      setVideoChapterId(chapterId)
      
      // This is just to demonstrate non-blocking behavior - 
      // The video will load immediately via the optimized service
      // while the subscription data continues to sync in the background
      if (!subscription) {
        dispatch(forceSyncSubscription())
      }
    } catch (error) {
      console.error('Error loading content:', error)
    }
  }
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSubscription ? (
            <p>Loading subscription data...</p>
          ) : (
            <div>
              <p>Plan: {subscription?.subscriptionPlan || 'FREE'}</p>
              <p>Status: {subscription?.status || 'INACTIVE'}</p>
              <p>Credits: {subscription?.credits || 0}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => dispatch(forceSyncSubscription())}
            disabled={isLoadingSubscription}
          >
            {isLoadingSubscription ? 'Syncing...' : 'Sync Subscription'}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="flex justify-center my-8">
        <Button 
          size="lg" 
          onClick={loadVideoContent}
          disabled={!subscription}
        >
          Load Video Content
        </Button>
      </div>
      
      {videoChapterId && (
        <OptimizedVideoPlayer
          chapterId={videoChapterId}
          topic="JavaScript programming tutorial"
          title="Programming Tutorial Video"
        />
      )}
    </div>
  )
}
