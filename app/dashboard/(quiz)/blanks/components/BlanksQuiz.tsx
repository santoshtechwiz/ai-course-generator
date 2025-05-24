'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { saveAnswer, setCurrentQuestionIndex } from '@/store/slices/quizSlice';


interface Blank {
  id: string;
  correctAnswer: string;
}

interface BlanksQuestion {
  id: string;
  type: 'blanks';
  textWithBlanks: string;
  blanks: Blank[];
  question?: string;
  text?: string;
}

interface BlanksAnswer {
  questionId: string;
  filledBlanks: Record<string, string>;
  timestamp: number;
}

interface BlanksQuizProps {
  questions: any[];
  currentQuestionIndex: number;
  answers: Record<string, any>;
  quizId: string;
}

export const BlanksQuiz: React.FC<BlanksQuizProps> = ({
  questions,
  currentQuestionIndex: initialQuestionIndex,
  answers,
  quizId
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [currentQuestionIndex, setCurrentIndex] = useState(initialQuestionIndex);
  
  // Ensure questions exist and are valid
  if (!questions || questions.length === 0) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-800">No questions available for this quiz.</p>
      </div>
    );
  }
  
  // Get current question (safely)
  const currentQuestion = questions[currentQuestionIndex] as BlanksQuestion;
  
  if (!currentQuestion) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-800">Question not found.</p>
      </div>
    );
  }
  
  // Get current answer if exists
  const currentAnswer = answers[currentQuestion.id] as BlanksAnswer | undefined;
  
  // Handle blank change
  const handleBlankChange = (blankId: string, value: string) => {
    if (!currentQuestion) return;
    
    const filledBlanks = {
      ...(currentAnswer?.filledBlanks || {}),
      [blankId]: value
    };
    
    const answer: BlanksAnswer = {
      questionId: currentQuestion.id,
      filledBlanks,
      timestamp: Date.now()
    };
    
    dispatch(saveAnswer({ questionId: currentQuestion.id, answer }));
  };
  
  // Handle navigation
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentIndex(currentQuestionIndex - 1);
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1));
    }
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentIndex(currentQuestionIndex + 1);
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1));
    }
  };
  
  // Parse text with blanks and render inputs
  const renderTextWithBlanks = () => {
    if (!currentQuestion.textWithBlanks) {
      return <p className="text-red-500">Error: Question format is invalid</p>;
    }
    
    const parts = currentQuestion.textWithBlanks.split(/\{\{([^}]+)\}\}/g);
    
    return parts.map((part, index) => {
      // Even indices are text, odd indices are blank IDs
      if (index % 2 === 0) {
        return <span key={index}>{part}</span>;
      } else {
        const blankId = part;
        return (
          <input
            key={index}
            type="text"
            className="mx-1 px-2 py-1 border-b-2 border-blue-500 focus:outline-none focus:border-blue-700 min-w-[100px] inline-block"
            value={(currentAnswer?.filledBlanks?.[blankId] || '')}
            onChange={(e) => handleBlankChange(blankId, e.target.value)}
            placeholder="..."
          />
        );
      }
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Question {currentQuestionIndex + 1}</h2>
        <p className="text-gray-800">Fill in the blanks:</p>
      </div>
      
      <div className="mb-8 text-lg leading-relaxed">
        {renderTextWithBlanks()}
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className={`px-4 py-2 rounded-lg ${
            currentQuestionIndex === 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Previous
        </button>
        
        <button
          onClick={handleNext}
          disabled={currentQuestionIndex === questions.length - 1}
          className={`px-4 py-2 rounded-lg ${
            currentQuestionIndex === questions.length - 1
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};
