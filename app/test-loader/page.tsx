"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGlobalLoading } from '@/store/slices/global-loading-slice'

export default function LoaderTestPage() {
  const { showLoading, hideLoading, hideAllLoading, isLoading, currentLoader } = useGlobalLoading()
  const [progress, setProgress] = useState(0)

  const showSimpleLoader = () => {
    showLoading({
      message: "Simple loading...",
      variant: 'spinner',
      theme: 'primary',
      isBlocking: false,
      priority: 1
    })
  }

  const showBlockingLoader = () => {
    showLoading({
      message: "Critical operation in progress...",
      subMessage: "Please do not close this window",
      variant: 'spinner',
      theme: 'primary',
      isBlocking: true,
      priority: 10
    })
  }

  const showProgressLoader = () => {
    const loaderId = showLoading({
      message: "Processing file...",
      subMessage: "Upload in progress",
      variant: 'spinner',
      theme: 'primary',
      isBlocking: true,
      priority: 5,
      progress: 0
    })

    // Simulate progress
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += 10
      setProgress(currentProgress)
      
      if (currentProgress <= 100) {
        // Update the loader progress - we'll need to add updateLoading to the hook
        // For now, we'll just show the progression
      }
      
      if (currentProgress >= 100) {
        clearInterval(interval)
        hideLoading(loaderId)
        setProgress(0)
      }
    }, 300)
  }

  const showSkeletonLoader = () => {
    showLoading({
      variant: 'skeleton',
      isBlocking: false,
      priority: 1
    })
  }

  const showDotsLoader = () => {
    showLoading({
      message: "Loading with dots...",
      variant: 'dots',
      theme: 'accent',
      isBlocking: false,
      priority: 1
    })
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Loader System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button onClick={showSimpleLoader}>
              Simple Loader
            </Button>
            <Button onClick={showBlockingLoader} variant="destructive">
              Blocking Loader
            </Button>
            <Button onClick={showProgressLoader}>
              Progress Loader
            </Button>
            <Button onClick={showSkeletonLoader} variant="outline">
              Skeleton Loader
            </Button>
            <Button onClick={showDotsLoader} variant="secondary">
              Dots Loader
            </Button>
            <Button onClick={hideAllLoading} variant="outline">
              Hide All Loaders
            </Button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <h3 className="font-semibold mb-2">Current State:</h3>
            <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Current Loader:</strong> {currentLoader?.message || 'None'}</p>
            <p><strong>Variant:</strong> {currentLoader?.variant || 'None'}</p>
            <p><strong>Is Blocking:</strong> {currentLoader?.isBlocking ? 'Yes' : 'No'}</p>
            <p><strong>Priority:</strong> {currentLoader?.priority || 'None'}</p>
            {progress > 0 && <p><strong>Progress:</strong> {progress}%</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <h4 className="font-semibold mb-2">Basic Usage:</h4>
            <pre className="text-sm overflow-x-auto">
{`const { showLoading, hideLoading } = useGlobalLoading()

const loaderId = showLoading({
  message: "Loading data...",
  variant: 'spinner',
  theme: 'primary',
  isBlocking: true,
  priority: 5
})

// Later...
hideLoading(loaderId)`}
            </pre>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <h4 className="font-semibold mb-2">Async Operation:</h4>
            <pre className="text-sm overflow-x-auto">
{`const handleAsyncAction = async () => {
  const loaderId = showLoading({
    message: "Processing...",
    isBlocking: true
  })
  
  try {
    await someAsyncOperation()
  } finally {
    hideLoading(loaderId)
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
