import { useCallback, useRef } from 'react'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: any
  sessionId: string
}

/**
 * Enhanced logging hook with production-safe logging and error reporting
 */
export function useDebugLogger(componentName: string) {
  const sessionId = useRef(generateSessionId()).current
  const logBuffer = useRef<LogEntry[]>([])
  
  const log = useCallback((level: LogLevel, message: string, data?: any) => {
    const timestamp = new Date().toISOString()
    const logEntry: LogEntry = {
      timestamp,
      level,
      component: componentName,
      message,
      data,
      sessionId
    }
    
    // Add to buffer for potential debugging
    logBuffer.current.push(logEntry)
    
    // Keep buffer size manageable
    if (logBuffer.current.length > 100) {
      logBuffer.current = logBuffer.current.slice(-50)
    }
    
    const logMessage = `[${timestamp}] [${componentName}] ${message}`
    
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'debug' ? 'log' : level
      console[consoleMethod](logMessage, data || '')
    }
    
    // Production error reporting
    if (process.env.NODE_ENV === 'production') {
      // Only log warnings and errors in production
      if (level === 'warn' || level === 'error') {
        // Send to error tracking service
        if (typeof window !== 'undefined') {
          // Sentry, LogRocket, or other error tracking
          try {
            if (window.Sentry) {
              window.Sentry.addBreadcrumb({
                message: logMessage,
                level: level === 'warn' ? 'warning' : 'error',
                data,
                category: componentName
              })
              
              if (level === 'error') {
                window.Sentry.captureException(new Error(logMessage), {
                  extra: data,
                  tags: {
                    component: componentName,
                    sessionId
                  }
                })
              }
            }
            
            // Custom analytics
            if (window.gtag) {
              window.gtag('event', 'component_log', {
                event_category: 'error_tracking',
                event_label: componentName,
                custom_parameter_1: level,
                custom_parameter_2: message.substring(0, 100) // Truncate for analytics
              })
            }
          } catch (reportingError) {
            // Fallback: at least log to console in production if reporting fails
            console.error('Failed to report error:', reportingError)
            console.error('Original error:', logMessage, data)
          }
        }
      }
      
      // Store critical errors in localStorage for debugging
      if (level === 'error') {
        try {
          const errorLogs = JSON.parse(localStorage.getItem('quiz_error_logs') || '[]')
          errorLogs.push(logEntry)
          
          // Keep only last 10 errors
          const recentErrors = errorLogs.slice(-10)
          localStorage.setItem('quiz_error_logs', JSON.stringify(recentErrors))
        } catch (storageError) {
          // Ignore storage errors
        }
      }
    }
  }, [componentName, sessionId])
  
  // Convenience methods
  const info = useCallback((message: string, data?: any) => log('info', message, data), [log])
  const warn = useCallback((message: string, data?: any) => log('warn', message, data), [log])
  const error = useCallback((message: string, data?: any) => log('error', message, data), [log])
  const debug = useCallback((message: string, data?: any) => log('debug', message, data), [log])
  
  // Get current log buffer for debugging
  const getLogBuffer = useCallback(() => [...logBuffer.current], [])
  
  // Clear log buffer
  const clearLogBuffer = useCallback(() => {
    logBuffer.current = []
  }, [])
  
  // Export logs for debugging
  const exportLogs = useCallback(() => {
    const logs = getLogBuffer()
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${componentName}-logs-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [getLogBuffer, componentName])
  
  return {
    log,
    info,
    warn,
    error,
    debug,
    getLogBuffer,
    clearLogBuffer,
    exportLogs,
    sessionId
  }
}

// Utility function to generate session ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Global error handler setup (call this in your app initialization)
export function setupGlobalErrorHandling() {
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      if (window.Sentry) {
        window.Sentry.captureException(event.reason)
      }
    })
    
    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error)
      
      if (window.Sentry) {
        window.Sentry.captureException(event.error)
      }
    })
  }
}

// Type declarations for global error tracking services
declare global {
  interface Window {
    Sentry?: {
      addBreadcrumb: (breadcrumb: any) => void
      captureException: (error: Error, context?: any) => void
    }
    gtag?: (...args: any[]) => void
    reportError?: (message: string, data?: any) => void
  }
}

