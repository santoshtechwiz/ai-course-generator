// ComponentMonitor.tsx - Global monitoring system
"use client"

import React, { useState, useEffect, useRef } from 'react'
import { AlertTriangle, Activity, Eye, X, RefreshCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ComponentError {
  id: string
  componentName: string
  error: Error
  timestamp: Date
  stack?: string
  props?: any
  retryCount: number
}

interface ComponentRender {
  id: string
  componentName: string
  timestamp: Date
  duration: number
  success: boolean
}

interface ComponentMonitorState {
  errors: ComponentError[]
  renders: ComponentRender[]
  isVisible: boolean
  filter: 'all' | 'errors' | 'renders'
}

class ComponentMonitorSingleton {
  private static instance: ComponentMonitorSingleton
  private listeners: Array<(state: ComponentMonitorState) => void> = []
  private state: ComponentMonitorState = {
    errors: [],
    renders: [],
    isVisible: false,
    filter: 'all'
  }

  static getInstance(): ComponentMonitorSingleton {
    if (!ComponentMonitorSingleton.instance) {
      ComponentMonitorSingleton.instance = new ComponentMonitorSingleton()
    }
    return ComponentMonitorSingleton.instance
  }

  subscribe(listener: (state: ComponentMonitorState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.state))
  }

  addError(componentName: string, error: Error, props?: any) {
    const errorEntry: ComponentError = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      componentName,
      error,
      timestamp: new Date(),
      stack: error.stack,
      props,
      retryCount: 0
    }

    this.state.errors.unshift(errorEntry)
    if (this.state.errors.length > 50) {
      this.state.errors = this.state.errors.slice(0, 50)
    }

    // Auto-show monitor on error in development
    if (process.env.NODE_ENV === 'development') {
      this.state.isVisible = true
    }

    this.notify()
    console.error(`Component Error [${componentName}]:`, error)
  }

  addRender(componentName: string, duration: number, success: boolean = true) {
    const renderEntry: ComponentRender = {
      id: `render-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      componentName,
      timestamp: new Date(),
      duration,
      success
    }

    this.state.renders.unshift(renderEntry)
    if (this.state.renders.length > 100) {
      this.state.renders = this.state.renders.slice(0, 100)
    }

    this.notify()
  }

  clearErrors() {
    this.state.errors = []
    this.notify()
  }

  clearRenders() {
    this.state.renders = []
    this.notify()
  }

  toggleVisibility() {
    this.state.isVisible = !this.state.isVisible
    this.notify()
  }

  setFilter(filter: 'all' | 'errors' | 'renders') {
    this.state.filter = filter
    this.notify()
  }

  exportData() {
    const data = {
      timestamp: new Date().toISOString(),
      errors: this.state.errors,
      renders: this.state.renders,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `component-debug-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  getState() {
    return this.state
  }
}

// Main Monitor Component
export const ComponentMonitor: React.FC = () => {
  const monitor = ComponentMonitorSingleton.getInstance()
  const [state, setState] = useState(monitor.getState())

  useEffect(() => {
    const unsubscribe = monitor.subscribe(setState)
    return unsubscribe
  }, [monitor])

  if (process.env.NODE_ENV !== 'development' || !state.isVisible) {
    return null
  }

  const errorCount = state.errors.length
  const recentErrors = state.errors.filter(e => 
    Date.now() - e.timestamp.getTime() < 60000 // Last minute
  ).length

  return (
    <div className="fixed bottom-4 right-4 w-96 z-[9999]">
      <Card className="border-2 border-yellow-500/50 bg-background/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-yellow-500" />
              Component Monitor
              {recentErrors > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {recentErrors} new
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => monitor.exportData()}
                className="h-6 w-6 p-0"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => monitor.toggleVisibility()}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-2">
          <Tabs defaultValue="errors" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="errors" className="text-xs">
                Errors ({errorCount})
              </TabsTrigger>
              <TabsTrigger value="renders" className="text-xs">
                Renders ({state.renders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="errors" className="mt-2">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-muted-foreground">Recent Errors</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => monitor.clearErrors()}
                  className="h-6 text-xs"
                >
                  Clear
                </Button>
              </div>
              <ScrollArea className="h-64">
                {state.errors.length === 0 ? (
                  <div className="text-center text-muted-foreground text-xs py-8">
                    No errors detected
                  </div>
                ) : (
                  <div className="space-y-2">
                    {state.errors.map((error) => (
                      <div 
                        key={error.id}
                        className="p-2 border rounded-md bg-destructive/5 border-destructive/20"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-medium text-destructive">
                            {error.componentName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {error.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-destructive/80 mb-2">
                          {error.error.message}
                        </p>
                        {error.props && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground">
                              Props
                            </summary>
                            <pre className="mt-1 p-1 bg-muted/50 rounded text-xs overflow-x-auto">
                              {JSON.stringify(error.props, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="renders" className="mt-2">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-muted-foreground">Component Renders</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => monitor.clearRenders()}
                  className="h-6 text-xs"
                >
                  Clear
                </Button>
              </div>
              <ScrollArea className="h-64">
                {state.renders.length === 0 ? (
                  <div className="text-center text-muted-foreground text-xs py-8">
                    No renders tracked
                  </div>
                ) : (
                  <div className="space-y-1">
                    {state.renders.map((render) => (
                      <div 
                        key={render.id}
                        className={`p-2 border rounded-md text-xs ${
                          render.success 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {render.componentName}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={render.duration > 16 ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {render.duration.toFixed(1)}ms
                            </Badge>
                            <span className="text-muted-foreground">
                              {render.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Debug Toggle Button (fixed position)
export const DebugToggle: React.FC = () => {
  const monitor = ComponentMonitorSingleton.getInstance()
  const [state, setState] = useState(monitor.getState())

  useEffect(() => {
    const unsubscribe = monitor.subscribe(setState)
    return unsubscribe
  }, [monitor])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const hasRecentErrors = state.errors.some(e => 
    Date.now() - e.timestamp.getTime() < 60000
  )

  return (
    <Button
      onClick={() => monitor.toggleVisibility()}
      className={`fixed bottom-4 left-4 z-[9998] h-10 w-10 p-0 rounded-full shadow-lg ${
        hasRecentErrors 
          ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground animate-pulse' 
          : 'bg-yellow-500 hover:bg-yellow-600 text-white'
      }`}
      title="Toggle Component Monitor"
    >
      {hasRecentErrors ? (
        <AlertTriangle className="h-5 w-5" />
      ) : (
        <Activity className="h-5 w-5" />
      )}
    </Button>
  )
}

// Enhanced Error Boundary with monitoring integration
export const MonitoredErrorBoundary: React.FC<{
  children: React.ReactNode
  componentName?: string
  fallback?: React.ReactNode
}> = ({ children, componentName = 'Unknown', fallback }) => {
  const monitor = ComponentMonitorSingleton.getInstance()

  return (
    <ErrorBoundaryClass 
      componentName={componentName}
      onError={(error, errorInfo) => {
        monitor.addError(componentName, error)
      }}
      fallback={fallback}
    >
      {children}
    </ErrorBoundaryClass>
  )
}

// Performance Monitor Hook
export const useRenderMonitor = (componentName: string) => {
  const monitor = ComponentMonitorSingleton.getInstance()
  const startTimeRef = useRef<number>()

  useEffect(() => {
    startTimeRef.current = performance.now()
    
    return () => {
      if (startTimeRef.current) {
        const duration = performance.now() - startTimeRef.current
        monitor.addRender(componentName, duration, true)
      }
    }
  })

  const reportError = (error: Error) => {
    monitor.addError(componentName, error)
  }

  return { reportError }
}

// Safe Component Wrapper
export const SafeComponent: React.FC<{
  children: React.ReactNode
  name: string
  showInMonitor?: boolean
  props?: any
}> = ({ children, name, showInMonitor = true, props }) => {
  const { reportError } = useRenderMonitor(name)

  try {
    if (showInMonitor && process.env.NODE_ENV === 'development') {
      return (
        <MonitoredErrorBoundary componentName={name}>
          <div data-component={name}>
            {children}
          </div>
        </MonitoredErrorBoundary>
      )
    }
    return <>{children}</>
  } catch (error) {
    if (error instanceof Error) {
      reportError(error)
    }
    return <div>Error in {name}</div>
  }
}

// Basic Error Boundary Class
class ErrorBoundaryClass extends React.Component<{
  children: React.ReactNode
  componentName: string
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  fallback?: React.ReactNode
}> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if ((this.state as any).hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
          <p className="text-sm text-destructive">
            Error in {this.props.componentName}
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

// Export the singleton for direct access
export const componentMonitor = ComponentMonitorSingleton.getInstance()