"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"


import { QuizCardListing } from "./QuizCardListing"
import { CreateQuizCard } from "./CreateQuizCard"
import { QuizListItem } from "@/app/types"

interface ExploreClientProps {
  initialQuizzes: QuizListItem[]
}

export function ExploreClient({ initialQuizzes }: ExploreClientProps) {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>(initialQuizzes)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredQuizzes = quizzes.filter((quiz) => quiz.topic.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <>
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
    </>
  )
}

