export interface QuizResult {
    quizId: string
    slug: string
    title: string
    quizType: string
    score: number
    maxScore: number
    totalAnswered: number
    percentage: number
    submittedAt: string
    questionResults: QuestionResult[]
    questions: Question[]
    answers: Answer[]
}

export interface QuestionResult {
    questionId: string
    isCorrect: boolean
    userAnswer: string
    correctAnswer: string
    skipped: boolean
}

export interface Question {
    id: number
    question: string
    codeSnippet: string
    options: string[]
    answer: string
}

export interface Answer {
    questionId: number
    selectedOptionId: string
    isCorrect: boolean
    userAnswer: string
    timestamp: number
}


export interface QuizResultHandlerProps {
    slug: string
    quizType: string
    result?: QuizResult
    showLayoutWrapper?: boolean
}
