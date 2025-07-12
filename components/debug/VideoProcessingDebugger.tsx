"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react'
import axios from 'axios'

interface VideoProcessingOverview {
  processing: number
  completed: number
  errors: number
  queue: {
    size: number
    pending: number
    active: number
  }
  metrics: {
    totalRequests: number
    cacheHits: number
    cacheMisses: number
    errors: number
    healthStatus: 'healthy' | 'warning' | 'critical'
  }
}

interface DiagnosticResult {
  issue: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  fix?: string
  fixApplied?: boolean
}

interface FixResponse {
  success: boolean
  summary: {
    totalIssues: number
    criticalIssues: number
    highIssues: number
    fixesApplied: number
    overallHealth: string
  }
  diagnostics: DiagnosticResult[]
  fixes: string[]
}

export default function VideoProcessingDebugger() {
  const [overview, setOverview] = useState<VideoProcessingOverview | null>(null)
  const [diagnostics, setDiagnostics] = useState<FixResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('/api/video/fix')
      setOverview(response.data.overview)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch overview')
    } finally {
      setLoading(false)
    }
  }

  const runDiagnostics = async (autoFix = false) => {
    try {
      setFixing(autoFix)
      setLoading(!autoFix)
      setError(null)

      const response = await axios.post('/api/video/fix', {
        action: 'diagnose',
        autoFix
      })

      setDiagnostics(response.data)
      
      if (autoFix) {
        // Refresh overview after fixes
        await fetchOverview()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run diagnostics')
    } finally {
      setLoading(false)
      setFixing(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      default: return 'outline'
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Video Processing Debugger</h2>
        <div className="space-x-2">
          <Button onClick={fetchOverview} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => runDiagnostics(false)} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Run Diagnostics
          </Button>
          <Button onClick={() => runDiagnostics(true)} disabled={fixing} variant="destructive">
            {fixing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Auto Fix Issues
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{overview.processing}</div>
              <p className="text-xs text-muted-foreground">chapters currently processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{overview.completed}</div>
              <p className="text-xs text-muted-foreground">chapters with videos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overview.errors}</div>
              <p className="text-xs text-muted-foreground">chapters with errors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.queue.size}</div>
              <p className="text-xs text-muted-foreground">
                {overview.queue.active} active, {overview.queue.pending} pending
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {overview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Service Metrics
              <Badge 
                variant={overview.metrics.healthStatus === 'healthy' ? 'default' : 'destructive'}
                className={getHealthColor(overview.metrics.healthStatus)}
              >
                {overview.metrics.healthStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Total Requests</div>
                <div className="text-muted-foreground">{overview.metrics.totalRequests}</div>
              </div>
              <div>
                <div className="font-medium">Cache Hits</div>
                <div className="text-muted-foreground">{overview.metrics.cacheHits}</div>
              </div>
              <div>
                <div className="font-medium">Cache Misses</div>
                <div className="text-muted-foreground">{overview.metrics.cacheMisses}</div>
              </div>
              <div>
                <div className="font-medium">Service Errors</div>
                <div className="text-muted-foreground">{overview.metrics.errors}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {diagnostics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Diagnostic Results
              <Badge variant={diagnostics.summary.overallHealth === 'healthy' ? 'default' : 'destructive'}>
                {diagnostics.summary.totalIssues} issues found
              </Badge>
            </CardTitle>
            <CardDescription>
              {diagnostics.summary.criticalIssues} critical, {diagnostics.summary.highIssues} high priority
              {diagnostics.summary.fixesApplied > 0 && ` • ${diagnostics.summary.fixesApplied} fixes applied`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diagnostics.diagnostics.map((diagnostic, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded">
                  <div className="mt-1">
                    {diagnostic.severity === 'critical' && <XCircle className="w-5 h-5 text-red-500" />}
                    {diagnostic.severity === 'high' && <AlertCircle className="w-5 h-5 text-orange-500" />}
                    {diagnostic.severity === 'medium' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
                    {diagnostic.severity === 'low' && <CheckCircle className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(diagnostic.severity) as any}>
                        {diagnostic.severity}
                      </Badge>
                      <span className="font-medium">{diagnostic.issue.replace(/_/g, ' ')}</span>
                      {diagnostic.fixApplied && (
                        <Badge variant="outline" className="text-green-600">
                          Fixed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{diagnostic.description}</p>
                    {diagnostic.fix && (
                      <p className="text-xs bg-muted p-2 rounded">
                        <strong>Suggested fix:</strong> {diagnostic.fix}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {diagnostics.fixes.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <h4 className="font-medium text-green-800 mb-2">Fixes Applied:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    {diagnostics.fixes.map((fix, index) => (
                      <li key={index}>• {fix}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
