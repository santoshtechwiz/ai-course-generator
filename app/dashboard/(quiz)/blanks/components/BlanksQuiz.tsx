"use client"

import { useState, useEffect, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch } from "@/store"
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
import { AlertTriangle } from "lucide-react"

interface BlanksQuizProps {
  quizId: string;
}

export const BlanksQuiz: React.FC<BlanksQuizProps> = ({ quizId }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Get data from Redux store
  const questions = useSelector(selectQuestions);
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
  const answers = useSelector(selectAnswers);
  const currentQuestion = useSelector(selectCurrentQuestion);
  
  // Track input changes before saving to Redux
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
  
  // Check if question format is valid
  const isValidFormat = currentQuestion.textWithBlanks && 
                       currentQuestion.textWithBlanks.includes("{{") && 
                       currentQuestion.textWithBlanks.includes("}}");
  
  // Parse text with blanks and render inputs
  const renderTextWithBlanks = useCallback(() => {
    if (!isValidFormat) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Question format is invalid</AlertDescription>
        </Alert>
      );
    }
    
    const parts = currentQuestion.textWithBlanks.split(/\{\{([^}]+)\}\}/g);
    
    return parts.map((part, index) => {
      // Even indices are text, odd indices are blank IDs
      if (index % 2 === 0) {
        return <span key={index}>{part}</span>;
      } else {
        const blankId = part;
        const currentValue = inputValues[blankId] || 
                           answers[currentQuestion.id]?.filledBlanks?.[blankId] || 
                           '';
        
        return (
          <input
            key={index}
            type="text"
            className="mx-1 px-2 py-1 border-b-2 border-primary/50 focus:outline-none focus:border-primary bg-transparent min-w-[100px] inline-block"
            value={currentValue}
            onChange={(e) => handleBlankChange(blankId, e.target.value)}
            placeholder="..."
          />
        );
      }
    });
  }, [currentQuestion, inputValues, answers, isValidFormat, handleBlankChange]);
  
  return (
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
        <p className="text-foreground mb-3">Fill in the blanks:</p>
        <div className="text-lg leading-relaxed">
          {renderTextWithBlanks()}
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          variant="outline"
        >
          Previous
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={currentQuestionIndex === questions.length - 1}
          variant={currentQuestionIndex === questions.length - 1 ? "outline" : "default"}
        >
          {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
        </Button>
      </div>
    </Card>
  );
};

export default BlanksQuiz;
