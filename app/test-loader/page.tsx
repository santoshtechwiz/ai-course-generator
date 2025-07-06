"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGlobalLoader } from '@/store/global-loader'

export default function LoaderTestPage() {  
  const { 
    startLoading, 
    stopLoading, 
    setSuccess, 
    setError, 
    setProgress,
    withLoading, 
    state, 
    isLoading,
    message,
    error 
  } = useGlobalLoader()
  const [progress, setLocalProgress] = useState(0)

  const showSimpleLoader = () => {
    startLoading({
      message: "Simple loading...",
      isBlocking: false
    })
    
    // Auto-hide after 3 seconds
    setTimeout(() => stopLoading(), 3000)
  }

  const showBlockingLoader = () => {
    startLoading({
      message: "Critical operation in progress...",
      subMessage: "Please do not close this window",
      isBlocking: true
    })
    
    // Auto-hide after 5 seconds
    setTimeout(() => stopLoading(), 5000)
  }

  const showProgressLoader = () => {
    startLoading({
      message: "Processing file...",
      subMessage: "Upload in progress",
      isBlocking: true,
      progress: 0
    })
    
    // Simulate progress
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += 10
      setLocalProgress(currentProgress)
      setProgress(currentProgress)
      
      if (currentProgress >= 100) {
        clearInterval(interval)
        setSuccess("Upload completed successfully!")
        setLocalProgress(0)
      }
    }, 300)
  }

  const showErrorState = () => {
    startLoading({
      message: "Attempting operation...",
      isBlocking: true
    })
    
    // Simulate an error after 2 seconds
    setTimeout(() => {
      setError("Operation failed. Please try again.")
    }, 2000)
  }

  const showSuccessState = () => {
    startLoading({
      message: "Processing request...",
      isBlocking: true
    })
    
    // Simulate success after 2 seconds
    setTimeout(() => {
      setSuccess("Operation completed successfully!")
    }, 2000)
  }

  const simulateAsyncOperation = async () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve("Operation completed successfully"), 2000)
    })
  }

  const handleAsyncWithLoading = () => {
    withLoading(
      simulateAsyncOperation(),
      {
        message: "Performing async operation...",
        isBlocking: true,
        onSuccess: (result) => {
          console.log("Success:", result)
        },
        onError: (error) => {
          console.error("Error:", error)
        }
      }
    ).catch(error => {
      console.log("Caught in component:", error)
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
            <Button onClick={showErrorState} variant="destructive">
              Show Error State
            </Button>
            <Button onClick={showSuccessState} variant="secondary">
              Show Success State
            </Button>
            <Button onClick={handleAsyncWithLoading} variant="secondary">
              Async with Loading
            </Button>
            <Button onClick={stopLoading} variant="outline">
              Stop Loading
            </Button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <h3 className="font-semibold mb-2">Current State:</h3>
            <p><strong>State:</strong> {state}</p>
            <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Message:</strong> {message || 'None'}</p>
            {progress > 0 && <p><strong>Progress:</strong> {progress}%</p>}
            {error && <p><strong>Error:</strong> {error}</p>}
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
{`const { startLoading, stopLoading } = useGlobalLoader()

// Start loading
startLoading({
  message: "Loading data...",
  isBlocking: true
})

// Stop loading
stopLoading()`}
            </pre>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <h4 className="font-semibold mb-2">Async Operation:</h4>
            <pre className="text-sm overflow-x-auto">
{`// Method 1: Manual management
const handleAsyncAction = async () => {
  startLoading({ message: "Processing..." })
  
  try {
    await someAsyncOperation()
    setSuccess("Operation completed!")
  } catch (error) {
    setError(error.message)
  }
}

// Method 2: Automatic with helper
const handleAsyncAction = () => {
  withLoading(
    someAsyncOperation(),
    { message: "Processing..." }
  )
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
