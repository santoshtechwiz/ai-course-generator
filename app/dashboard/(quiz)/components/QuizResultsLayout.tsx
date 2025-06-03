"use client"

import React from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Share2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"

interface QuizResultsLayoutProps {
  title: string
  score: number
  maxScore: number
  children: React.ReactNode
  onRetry?: () => void
  onShare?: () => void
  onDownload?: () => void
  additionalTabs?: {
    id: string
    label: string
    content: React.ReactNode
  }[]
}

export const QuizResultsLayout: React.FC<QuizResultsLayoutProps> = ({
  title,
  score,
  maxScore,
  children,
  onRetry,
  onShare,
  onDownload,
  additionalTabs = []
}) => {
  const router = useRouter()
  const percentage = Math.round((score / maxScore) * 100)
  
  // Determine score color based on percentage
  const getScoreColor = () => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-amber-600"
    return "text-red-600"
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">{title} Results</CardTitle>
          <CardDescription>
            Your performance summary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="text-center md:text-left">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Your Score
              </h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${getScoreColor()}`}>
                  {score}
                </span>
                <span className="text-xl text-muted-foreground">
                  / {maxScore}
                </span>
                <span className={`text-xl font-medium ${getScoreColor()}`}>
                  ({percentage}%)
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {onRetry && (
                <Button onClick={onRetry} variant="outline">
                  Try Again
                </Button>
              )}
              {onShare && (
                <Button onClick={onShare} variant="outline" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              )}
              {onDownload && (
                <Button onClick={onDownload} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          </div>
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              {additionalTabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="details" className="mt-0">
              {children}
            </TabsContent>
            
            {additionalTabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
