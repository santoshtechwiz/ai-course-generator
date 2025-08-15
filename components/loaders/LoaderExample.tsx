"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLoader } from '@/hooks/useLoader'

export function LoaderExample() {
  const [result, setResult] = useState<string>('')
  const loader = useLoader({
    defaultMessage: 'Processing...',
    defaultMinVisibleMs: 1000
  })

  const handleSimpleLoading = async () => {
    loader.show('Starting simple operation...')
    
    // Simulate async work
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    loader.success('Simple operation completed!')
  }

  const handleProgressLoading = async () => {
    loader.show('Processing with progress...', true)
    
    // Simulate progress updates
    for (let i = 0; i <= 100; i += 10) {
      loader.progress(i)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    loader.success('Progress operation completed!')
  }

  const handleErrorLoading = async () => {
    try {
      await loader.execute(
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Something went wrong!')), 1500)
        }),
        {
          message: 'Attempting risky operation...',
          onError: (error) => {
            console.error('Operation failed:', error)
          }
        }
      )
    } catch (error) {
      // Error is already handled by the loader
    }
  }

  const handleAsyncOperation = async () => {
    try {
      const data = await loader.execute(
        fetch('https://jsonplaceholder.typicode.com/posts/1').then(res => res.json()),
        {
          message: 'Fetching data...',
          onSuccess: (data) => {
            setResult(JSON.stringify(data, null, 2))
          }
        }
      )
    } catch (error) {
      setResult('Failed to fetch data')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Loader Examples</CardTitle>
          <CardDescription>
            Demonstrating the new simplified loader system with best practices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={handleSimpleLoading} variant="outline">
              Simple Loading
            </Button>
            
            <Button onClick={handleProgressLoading} variant="outline">
              Progress Loading
            </Button>
            
            <Button onClick={handleErrorLoading} variant="outline">
              Error Loading
            </Button>
            
            <Button onClick={handleAsyncOperation} variant="outline">
              Async Operation
            </Button>
          </div>

          {result && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Result:</h4>
              <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                {result}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}