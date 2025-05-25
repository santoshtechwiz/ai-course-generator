import React, { useState } from 'react'

interface QuizSubmissionLoadingProps {
  quizType?: 'mcq' | 'code' | 'blanks' | 'openended' | 'flashcard' | 'fill-blanks'
  message?: string
  progress?: number
}

export const QuizSubmissionLoading: React.FC<QuizSubmissionLoadingProps> = ({ 
  quizType = 'mcq',
  message,
  progress
}) => {
  const [dots, setDots] = useState('.')
  
  // Update dots animation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '.')
    }, 500)
    
    return () => clearInterval(interval)
  }, [])
  
  // Get appropriate message based on quiz type
  const getSubmissionMessage = () => {
    if (message) return message
    
    switch(quizType) {
      case 'mcq':
        return "Submitting your multiple choice answers"
      case 'code':
        return "Processing your code solutions"
      case 'blanks':
      case 'fill-blanks':
        return "Checking your fill-in-the-blank answers"
      case 'openended':
        return "Submitting your written responses"
      case 'flashcard':
        return "Saving your flashcard progress"
      default:
        return "Submitting your quiz"
    }
  }

  return (
    <div>
      <p>{getSubmissionMessage()}{dots}</p>
      {progress !== undefined && (
        <progress value={progress} max="100" />
      )}
    </div>
  )
}