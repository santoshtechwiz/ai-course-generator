"use client"

import { useState, useEffect, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import React from "react"
import { 
  saveAnswer,
  setCurrentQuestionIndex,
  selectQuestions,
  selectCurrentQuestionIndex,
  selectAnswers,
  selectCurrentQuestion
} from "@/store/slices/quizSlice"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { BlankQuizQuestion } from "../types/blanks-quiz"

export function BlanksQuiz() {
  const dispatch = useDispatch();
  
  // Get data from Redux store
  const questions = useSelector(selectQuestions);
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
  const answers = useSelector(selectAnswers);
  const currentQuestion = useSelector(selectCurrentQuestion) as BlankQuizQuestion;
  
  // Track input values before saving to Redux
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  
  // Initialize inputValues from existing answers when component mounts or question changes
  useEffect(() => {
    if (currentQuestion?.id && answers[currentQuestion.id]?.filledBlanks) {
      setInputValues(answers[currentQuestion.id].filledBlanks || {});
    } else {
      setInputValues({});
    }
  }, [currentQuestion, answers]);
  
  // Handle blank change
  const handleBlankChange = useCallback((blankId: string, value: string) => {
    if (!currentQuestion) return;
    
    // Update local state first for responsive UI
    setInputValues(prev => ({
      ...prev,
      [blankId]: value
    }));
    
    // Then dispatch to Redux
    const filledBlanks = {
      ...(answers[currentQuestion.id]?.filledBlanks || {}),
      [blankId]: value
    };
    
    dispatch(saveAnswer({ 
      questionId: currentQuestion.id, 
      answer: {
        questionId: currentQuestion.id,
        filledBlanks,
        timestamp: Date.now()
      }
    }));
  }, [currentQuestion, answers, dispatch]);
  
  // Handle navigation
  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1));
    }
  }, [currentQuestionIndex, dispatch]);
  
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1));
    }
  }, [currentQuestionIndex, questions.length, dispatch]);
  
  if (!currentQuestion || questions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-bold mb-2">No Questions Available</h2>
          <p className="text-gray-600">This quiz doesn't have any questions yet, or we couldn't load them.</p>
        </div>
      </Card>
    );
  }
  
  // Parse text with blanks from the API response format
  const renderTextWithBlanks = () => {
    // Get question text from the API response
    const questionText = currentQuestion.question || "";
    
    // Check if the question contains blanks (indicated by underscores)
    if (questionText.includes("_")) {
      // Split by underscores pattern
      const parts = questionText.split(/(_+)/g);
      
      return parts.map((part, index) => {
        // If this part is underscores, render an input field
        if (part.match(/^_+$/)) {
          const blankId = `blank_${index}`;
          const currentValue = inputValues[blankId] || '';
          
          return (
            <motion.input
              key={index}
              type="text"
              className="mx-1 px-2 py-1 border-b-2 border-primary/50 focus:outline-none focus:border-primary bg-transparent min-w-[100px] inline-block transition-all duration-200"
              value={currentValue}
              onChange={(e) => handleBlankChange(blankId, e.target.value)}
              placeholder="..."
              data-testid={`blank-input-${index}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            />
          );
        }
        
        // Otherwise, render the text
        return <span key={index} data-testid={`text-part-${index}`}>{part}</span>;
      });
    }
    
    // If no underscores, try to handle the format with __________
    if (questionText.includes("__________")) {
      const parts = questionText.split(/__________/g);
      
      return parts.map((part, index) => {
        if (index === parts.length - 1) {
          return <span key={index} data-testid={`text-part-${index}`}>{part}</span>;
        }
        
        const blankId = `blank_${index}`;
        const currentValue = inputValues[blankId] || '';
        
        return (
          <React.Fragment key={index}>
            <span data-testid={`text-part-${index}`}>{part}</span>
            <motion.input
              type="text"
              className="mx-1 px-2 py-1 border-b-2 border-primary/50 focus:outline-none focus:border-primary bg-transparent min-w-[100px] inline-block transition-all duration-200"
              value={currentValue}
              onChange={(e) => handleBlankChange(blankId, e.target.value)}
              placeholder="..."
              data-testid={`blank-input-${index}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            />
          </React.Fragment>
        );
      });
    }
    
    // If neither format is detected, show error
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Question format is invalid</AlertDescription>
      </Alert>
    );
  };
  
  return (
    <motion.div
      key={currentQuestionIndex}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card shadow-md p-6">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Question {currentQuestionIndex + 1} of {questions.length}</h2>
            <span className="text-sm text-muted-foreground">
              {Math.floor((currentQuestionIndex / questions.length) * 100)}% complete
            </span>
          </div>
          <Progress value={(currentQuestionIndex / questions.length) * 100} className="h-2" />
        </div>
        
        <div className="mb-8">
          <p className="text-foreground mb-3 font-medium">Fill in the blanks:</p>
          <div className="text-lg leading-relaxed">
            {renderTextWithBlanks()}
          </div>
          
          {/* Show the expected answer for testing/debugging - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-sm">
              <p className="text-gray-500">Expected answer: <span className="font-mono">{currentQuestion.answer}</span></p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="flex items-center"
            data-testid="previous-button"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={currentQuestionIndex === questions.length - 1}
            variant={currentQuestionIndex === questions.length - 1 ? "outline" : "default"}
            className="flex items-center"
            data-testid="next-button"
          >
            {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"} <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
