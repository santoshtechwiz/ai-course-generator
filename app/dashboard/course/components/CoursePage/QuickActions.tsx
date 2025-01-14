import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, BookOpen, Brain, Settings } from 'lucide-react'

export default function QuickActions() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => window.location.href='/dashboard/create'} className="flex items-center space-x-2">
            <PlusCircle className="h-4 w-4" />
            <span>New Course</span>
          </Button>
         
          <Button variant="outline" onClick={() => window.location.href='/dashboard/quizzes'} className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Take a Quiz</span>
          </Button>
          
        </div>
      </CardContent>
    </Card>
  )
}

