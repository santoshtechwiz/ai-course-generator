'use client'

import { useState } from 'react'
import { OptimizedVideoLoader } from './OptimizedVideoLoader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface VideoPlayerProps {
  chapterId: number
  topic?: string
  title?: string
}

/**
 * Non-blocking video player component that uses the optimized video service
 * Demonstrates how to integrate with the quick response API for better UX
 */
export const OptimizedVideoPlayer = ({ 
  chapterId, 
  topic,
  title = 'Chapter Video' 
}: VideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  
  const { videoId, loading, processingStatus } = OptimizedVideoLoader({
    chapterId,
    topic,
    key: refreshCount, // Force refresh when this changes
    onVideoReady: () => setIsLoading(false),
    onError: () => setIsLoading(false)
  })
  
  const handleRefresh = () => {
    setIsLoading(true)
    setRefreshCount(prev => prev + 1) // Trigger a reload
  }
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {processingStatus === 'loading' ? 'Preparing video content...' : 
           processingStatus === 'error' ? 'Using fallback content' : 
           'Video content ready'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {videoId ? (
          <div className="aspect-video w-full">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <div className="aspect-video w-full bg-muted flex items-center justify-center">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4">Loading video content...</p>
              </div>
            ) : (
              <p>No video content available</p>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {processingStatus === 'loading' ? 
            'Initial content loaded, optimizing in background...' : 
            processingStatus === 'success' ? 
            'Optimized content loaded' : 
            'Using available content'}
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Video'}
        </Button>
      </CardFooter>
    </Card>
  )
}
