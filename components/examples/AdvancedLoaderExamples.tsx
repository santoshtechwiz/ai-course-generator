"use client"

import React, { useState } from "react"
import { useGlobalLoader } from "@/store/global-loader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, Shield, Save, Trash2, Search, BookOpen, User, Zap, Sparkles } from "lucide-react"

export function AdvancedLoaderExamples() {
  const { 
    startLoading, 
    startRouteLoading, 
    startApiLoading, 
    startUploadLoading, 
    startQuizLoading, 
    startAuthLoading,
    setProgress,
    withLoading,
    clearAll 
  } = useGlobalLoader()

  const [currentExample, setCurrentExample] = useState<string | null>(null)

  // Context-specific examples
  const examples = [
    {
      id: "route",
      title: "Route Navigation",
      description: "Smooth page transitions with shimmer effect",
      icon: Sparkles,
      action: () => {
        setCurrentExample("route")
        startRouteLoading("/dashboard/profile")
        setTimeout(() => setCurrentExample(null), 3000)
      }
    },
    {
      id: "api",
      title: "API Requests",
      description: "Non-blocking data fetching",
      icon: Zap,
      action: () => {
        setCurrentExample("api")
        startApiLoading("/api/users", "GET")
        setTimeout(() => setCurrentExample(null), 2000)
      }
    },
    {
      id: "upload",
      title: "File Upload",
      description: "Progress tracking with visual feedback",
      icon: Upload,
      action: async () => {
        setCurrentExample("upload")
        const uploadId = startUploadLoading("document.pdf")
        
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 200))
          setProgress(i, uploadId)
        }
        
        setTimeout(() => setCurrentExample(null), 1000)
      }
    },
    {
      id: "auth",
      title: "Authentication",
      description: "Secure login with pulse animation",
      icon: Shield,
      action: () => {
        setCurrentExample("auth")
        startAuthLoading("Logging in")
        setTimeout(() => setCurrentExample(null), 2500)
      }
    },
    {
      id: "quiz",
      title: "Quiz Loading",
      description: "Context-aware learning experience",
      icon: BookOpen,
      action: () => {
        setCurrentExample("quiz")
        startQuizLoading("Machine Learning")
        setTimeout(() => setCurrentExample(null), 3000)
      }
    },
    {
      id: "save",
      title: "Save Changes",
      description: "Non-blocking with dots animation",
      icon: Save,
      action: () => {
        setCurrentExample("save")
        startLoading({ 
          context: "save",
          message: "Saving your progress...",
          retryable: true 
        })
        setTimeout(() => setCurrentExample(null), 2000)
      }
    },
    {
      id: "delete",
      title: "Delete Item",
      description: "Minimal confirmation loader",
      icon: Trash2,
      action: () => {
        setCurrentExample("delete")
        startLoading({ 
          context: "delete",
          message: "Deleting quiz...",
          subMessage: "This action cannot be undone"
        })
        setTimeout(() => setCurrentExample(null), 1500)
      }
    },
    {
      id: "generate",
      title: "AI Generation",
      description: "Long-running AI process with timeout",
      icon: Sparkles,
      action: () => {
        setCurrentExample("generate")
        startLoading({ 
          context: "generate",
          message: "AI is creating your quiz...",
          subMessage: "Using advanced machine learning models",
          timeout: 60000
        })
        setTimeout(() => setCurrentExample(null), 4000)
      }
    },
    {
      id: "withLoading",
      title: "Async Wrapper",
      description: "Automatic error/success handling",
      icon: Zap,
      action: async () => {
        setCurrentExample("withLoading")
        try {
          await withLoading(
            // Simulate API call
            new Promise((resolve, reject) => {
              setTimeout(() => {
                Math.random() > 0.5 ? resolve("Success!") : reject(new Error("Failed"))
              }, 2000)
            }),
            {
              context: "api",
              message: "Processing request...",
              onSuccess: (result) => console.log("Success:", result),
              onError: (error) => console.log("Error:", error)
            }
          )
        } catch (error) {
          // Error handled automatically
        }
        setTimeout(() => setCurrentExample(null), 1000)
      }
    }
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Advanced Global Loader</h1>
        <p className="text-muted-foreground">
          Context-aware loading with intelligent prioritization and beautiful animations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {examples.map((example) => {
          const IconComponent = example.icon
          const isActive = currentExample === example.id
          
          return (
            <Card 
              key={example.id} 
              className={`cursor-pointer transition-all ${
                isActive ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
              }`}
              onClick={example.action}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{example.title}</CardTitle>
                    {isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  {example.description}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex gap-4 justify-center">
        <Button 
          variant="outline" 
          onClick={clearAll}
          className="text-red-600 hover:bg-red-50"
        >
          Clear All Loaders
        </Button>
        <Button 
          variant="outline"
          onClick={() => {
            // Test multiple concurrent loaders
            startLoading({ context: "save", priority: 10 })
            startLoading({ context: "api", priority: 5 })
            startLoading({ context: "upload", priority: 90 })
            setTimeout(clearAll, 5000)
          }}
        >
          Test Priority System
        </Button>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Features Demonstrated</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>✅ 13 Context Types</div>
            <div>✅ Priority-based Queue</div>
            <div>✅ Progress Tracking</div>
            <div>✅ Auto-timeout</div>
            <div>✅ Retry Capability</div>
            <div>✅ Success/Error States</div>
            <div>✅ Non-blocking Options</div>
            <div>✅ Context-specific Icons</div>
            <div>✅ Adaptive Animations</div>
            <div>✅ Background Effects</div>
            <div>✅ TypeScript Ready</div>
            <div>✅ withLoading Helper</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}