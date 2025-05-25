"use client"

import React, { use, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Code, Play, Info } from "lucide-react"
import { LoadingOverlay, SkeletonLoader } from "../../components/LoadingComponents"
import { InitializingDisplay } from "../../components/QuizStateDisplay"
import CodeQuizWrapperRedux from "../components/CodeQuizWrapperRedux"

interface CodeQuizPageProps {
  params: Promise<{ slug: string }> | { slug: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

// Wrapper component that handles data fetching
function CodeQuizContent({ slug }: { slug: string }) {
  const router = useRouter()
  const [quizData, setQuizData] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [userId, setUserId] = React.useState<string | null>(null)

  // Fetch quiz data and auth status
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch auth status
        const authResponse = await fetch('/api/auth/session')
        const authData = await authResponse.json()
        setUserId(authData?.user?.id || null)
        
        // Fetch quiz data
        const quizResponse = await fetch(`/api/quizzes/code/${slug}`)
        
        if (!quizResponse.ok) {
          throw new Error(quizResponse.status === 404 
            ? 'Quiz not found' 
            : 'Failed to load quiz data')
        }
        
        const data = await quizResponse.json()
        setQuizData(data)
        setError(null)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [slug])

  // Loading state
  if (isLoading) {
    return <InitializingDisplay message="Loading code quiz..." />
  }
  
  // Error state
  if (error) {
    return (
      <Card className="w-full max-w-3xl mx-auto border-destructive/20">
        <CardHeader>
          <CardTitle className="text-xl text-center text-destructive">Error Loading Quiz</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="bg-destructive/10 rounded-full p-3">
              <Info className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <p className="mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Empty questions state
  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-center">No Questions Available</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>This code quiz doesn't contain any questions.</p>
          <Button onClick={() => router.push("/dashboard")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Render the code quiz wrapper with data
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">{quizData.title || "Code Quiz"}</h1>
        </div>
      </div>
      
      <Card className="w-full">
        <CardContent className="p-0">
          <Tabs defaultValue="quiz" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="quiz" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Take Quiz
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Quiz Info
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="quiz" className="p-6">
              <CodeQuizWrapperRedux
                slug={slug}
                quizId={quizData.id || slug}
                userId={userId}
                quizData={quizData}
              />
            </TabsContent>
            
            <TabsContent value="info" className="p-6">
              <div className="space-y-4">
                <h2 className="text-lg font-medium">About This Quiz</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Title</p>
                    <p className="font-medium">{quizData.title || "Code Quiz"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Questions</p>
                    <p className="font-medium">{quizData.questions?.length || 0} questions</p>
                  </div>
                  {quizData.description && (
                    <div className="col-span-2 space-y-2">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p>{quizData.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={() => document.querySelector('[data-value="quiz"]')?.click()}
                    className="w-full"
                  >
                    Start Quiz
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CodeQuizPage({ params, searchParams }: CodeQuizPageProps) {
  // Properly unwrap params using React.use()
  const { slug } = params instanceof Promise 
    ? use(params) 
    : params as { slug: string }
  
  return (
    <div className="container max-w-4xl py-6">
      <Suspense fallback={<InitializingDisplay message="Loading code quiz..." />}>
        <CodeQuizContent slug={slug} />
      </Suspense>
    </div>
  )
}
