'use client'

import { useState, useEffect } from 'react'

import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react'
import { CreateQuizCard, QuizCardListing } from './components/QuizCardListing'
import { Quiz } from '@/app/types'



export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Fetch quizzes from your API
    const fetchQuizzes = async () => {
      const response = await fetch('/api/quizzes')
      const data = await response.json()
      setQuizzes(data)
    }
    fetchQuizzes()
  }, [])

  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.topic.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Explore Quizzes</h1>
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search quizzes..."
          className="pl-10 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.map((quiz, index) => (
          <QuizCardListing key={quiz.id} quiz={quiz} index={index} />
        ))}
        <CreateQuizCard />
      </div>
    </div>
  )
}

