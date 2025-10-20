"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/loader"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Clock, Zap } from "lucide-react"

interface TestConfig {
  name: string
  endpoint: string
  payload: Record<string, any>
  tier: "FREE" | "PREMIUM" | "ENTERPRISE"
}

interface TestResult {
  success: boolean
  duration: number
  status: number
  data?: any
  error?: string
}

const testConfigs: Record<string, TestConfig> = {
  mcq: {
    name: "Multiple Choice Quiz",
    endpoint: "/api/quizzes/mcq/create",
    payload: { title: "JavaScript Basics", amount: 3, difficulty: "medium" },
    tier: "FREE",
  },
  flashcards: {
    name: "Flashcards",
    endpoint: "/api/quizzes/flashcard/create",
    payload: { title: "React Hooks", amount: 5 },
    tier: "FREE",
  },
  ordering: {
    name: "Ordering Quiz",
    endpoint: "/api/ordering-quizzes/generate",
    payload: { topic: "Git Workflow", numberOfSteps: 5, difficulty: "medium" },
    tier: "FREE",
  },
  blanks: {
    name: "Fill in the Blanks",
    endpoint: "/api/blanks",
    payload: { title: "Python Variables", amount: 4, difficulty: "easy" },
    tier: "FREE",
  },
  openended: {
    name: "Open-Ended Questions",
    endpoint: "/api/quizzes/openended/create",
    payload: { title: "Machine Learning", amount: 3, difficulty: "hard" },
    tier: "PREMIUM",
  },
  code: {
    name: "Code Quiz",
    endpoint: "/api/quizzes/code/create",
    payload: { title: "JavaScript Functions", amount: 3, difficulty: "medium" },
    tier: "PREMIUM",
  },
  video: {
    name: "Video Quiz",
    endpoint: "/api/video",
    payload: {
      courseTitle: "React Tutorial",
      transcript:
        "React is a JavaScript library for building user interfaces. Components are the building blocks of React applications. Props allow you to pass data to components.",
      numberOfQuestions: 3,
    },
    tier: "FREE",
  },
  course: {
    name: "Course Content",
    endpoint: "/api/course",
    payload: { title: "Web Development Fundamentals", units: 3, category: "Programming" },
    tier: "ENTERPRISE",
  },
  summary: {
    name: "Text Summary",
    endpoint: "/api/summary",
    payload: {
      transcript:
        "Artificial Intelligence is transforming how we interact with technology. Machine learning algorithms can analyze vast amounts of data to identify patterns and make predictions. Deep learning, a subset of machine learning, uses neural networks with multiple layers to process complex information.",
      summaryLength: 100,
    },
    tier: "FREE",
  },
  document: {
    name: "Document Quiz",
    endpoint: "/api/document",
    payload: {
      documentText:
        "The water cycle describes how water evaporates from the surface of the earth, rises into the atmosphere, cools and condenses into rain or snow in clouds, and falls again to the surface as precipitation.",
      numberOfQuestions: 3,
    },
    tier: "PREMIUM",
  },
}

export default function AIDebugDashboard() {
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<{ type: string; data: TestResult } | null>(null)

  const testFunction = async (functionType: string) => {
    const config = testConfigs[functionType]
    setLoading(functionType)
    setResult(null)

    try {
      const startTime = Date.now()
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(config.payload),
      })

      const data = await response.json()
      const duration = Date.now() - startTime

      setResult({
        type: functionType,
        data: {
          success: response.ok && data.success !== false,
          duration,
          status: response.status,
          data,
          error: data.error || data.message,
        },
      })
    } catch (error) {
      setResult({
        type: functionType,
        data: {
          success: false,
          duration: 0,
          status: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      })
    } finally {
      setLoading(null)
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "FREE":
        return "bg-green-500 hover:bg-green-600"
      case "PREMIUM":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "ENTERPRISE":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Quiz Generation Functions */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Generation Functions</CardTitle>
          <CardDescription>Test various quiz generation endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(testConfigs)
              .filter(([_, config]) =>
                ["mcq", "flashcards", "ordering", "blanks", "openended", "code", "video"].includes(_)
              )
              .map(([key, config]) => (
                <Card key={key} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{config.name}</CardTitle>
                      <Badge className={getTierBadgeColor(config.tier)}>{config.tier}</Badge>
                    </div>
                    <CardDescription className="text-xs">{config.endpoint}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => testFunction(key)}
                      disabled={loading === key}
                      className="w-full"
                      size="sm"
                    >
                      {loading === key ? (
                        <>
                          <Loader message="" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Test Function
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Generation Functions */}
      <Card>
        <CardHeader>
          <CardTitle>Content Generation Functions</CardTitle>
          <CardDescription>Test course and content generation endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(testConfigs)
              .filter(([_, config]) => ["course", "summary", "document"].includes(_))
              .map(([key, config]) => (
                <Card key={key} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{config.name}</CardTitle>
                      <Badge className={getTierBadgeColor(config.tier)}>{config.tier}</Badge>
                    </div>
                    <CardDescription className="text-xs">{config.endpoint}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => testFunction(key)}
                      disabled={loading === key}
                      className="w-full"
                      size="sm"
                    >
                      {loading === key ? (
                        <>
                          <Loader message="" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Test Function
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.data.success ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              {result.data.success ? "Test Passed" : "Test Failed"} -{" "}
              {testConfigs[result.type].name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Clock className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{result.data.duration}ms</div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{result.data.status}</div>
                <div className="text-xs text-muted-foreground">HTTP Status</div>
              </div>
              {result.data.data?.creditsRemaining !== undefined && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{result.data.data.creditsRemaining}</div>
                  <div className="text-xs text-muted-foreground">Credits Remaining</div>
                </div>
              )}
            </div>

            {/* Request */}
            <div>
              <h4 className="font-semibold mb-2">Request Payload:</h4>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(testConfigs[result.type].payload, null, 2)}
              </pre>
            </div>

            {/* Response */}
            {result.data.success ? (
              <div>
                <h4 className="font-semibold mb-2">Response Data:</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs max-h-96">
                  {JSON.stringify(result.data.data, null, 2)}
                </pre>
              </div>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {result.data.error || "Unknown error occurred"}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!result && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Click any test button to execute the AI function</p>
            <p>• Results will show response data, duration, and credits used</p>
            <p>• All tests use the authenticated admin session</p>
            <p>• Test different subscription tiers (FREE, PREMIUM, ENTERPRISE)</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
