"use client"


import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  selectQuestions, 
  selectCurrentQuestionIndex, 
  selectAnswers, 
  selectCurrentQuestion, 
  setCurrentQuestionIndex, 
  saveAnswer,
  submitQuiz,
 
} from "@/store/slices/quizSlice";
import { Progress } from "@radix-ui/react-progress";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

interface OpenEndedQuizProps {
  onAnswer?: (answer: string, elapsedTime: number, hintsUsed: boolean) => void;
}
interface OpenEndedQuizQuestion {
  id: string;
  question: string;
  hints?: string[];
}
export function OpenEndedQuiz({ onAnswer }: OpenEndedQuizProps) {
  const dispatch = useDispatch();
  
  // Get data from Redux store
  const questions = useSelector(selectQuestions);
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
  const answers = useSelector(selectAnswers);
  const currentQuestion = useSelector(selectCurrentQuestion) as OpenEndedQuizQuestion;
  
  // Local state
  const [answer, setAnswer] = useState("");
  const [startTime, setStartTime] = useState(Date.now());
  const [hintsUsed, setHintsUsed] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  // Initialize answer from existing answers when component mounts or question changes
  useEffect(() => {
    if (currentQuestion?.id && answers[currentQuestion.id]?.text) {
      setAnswer(answers[currentQuestion.id].text || "");
      setHasAnswered(true);
    } else {
      setAnswer("");
      setHasAnswered(false);
    }
    setShowHints(false);
    setHintsUsed(false);
    setStartTime(Date.now()); // Reset timer for each question
  }, [currentQuestion, answers]);
  
  // Handle answer change
  const handleAnswerChange = useCallback((value: string) => {
    setAnswer(value);
  }, []);
  
  // Handle showing hints
  const handleShowHints = useCallback(() => {
    setShowHints(true);
    setHintsUsed(true);
  }, []);
  
  // Handle navigation
  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1));
    }
  }, [currentQuestionIndex, dispatch]);

  // Handle navigation to next question
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1));
    }
  }, [currentQuestionIndex, questions.length, dispatch]);
  
  // Handle submission
  const handleSubmit = useCallback(() => {
    if (!currentQuestion || !answer.trim() || isSubmitting) return;
    
    setIsSubmitting(true);

    // Calculate elapsed time
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);

    // Call the onAnswer callback if provided
    if (onAnswer) {
      onAnswer(answer, elapsedTime, hintsUsed);
    }
    
    // Mark as answered locally
    setHasAnswered(true);
    setIsSubmitting(false);
  }, [currentQuestion, answer, startTime, hintsUsed, onAnswer, isSubmitting]);

  // Handle final submission
  const handleFinishQuiz = useCallback(() => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Make sure the current answer is saved first
    if (currentQuestion && answer.trim()) {
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      if (onAnswer) {
        onAnswer(answer, elapsedTime, hintsUsed);
      }
    }
    
    // Submit the entire quiz
    dispatch(submitQuiz());
    
    setIsSubmitting(false);
  }, [answer, currentQuestion, dispatch, hintsUsed, isSubmitting, onAnswer, startTime]);

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
        
        <div className="mb-6">
          <p className="text-lg font-medium mb-4">{currentQuestion.question}</p>
          
          {currentQuestion.hints && currentQuestion.hints.length > 0 && (
            <div className="mb-4">
              {!showHints ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShowHints}
                  className="text-sm"
                >
                  Show Hints
                </Button>
              ) : (
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium text-sm mb-2">Hints:</p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {currentQuestion.hints.map((hint, index) => (
                      <li key={index}>{hint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <Textarea
            value={answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[150px] resize-y"
          />
        </div>
        
        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="flex items-center"
          >
            Previous
          </Button>
          
          {!hasAnswered ? (
            <Button
              onClick={handleSubmit}
              variant="default"
              className="flex items-center"
              disabled={!answer.trim() || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Answer"}
            </Button>
          ) : (
            <Button
              onClick={currentQuestionIndex === questions.length - 1 ? handleFinishQuiz : handleNext}
              variant="default"
              className="flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? 
                (currentQuestionIndex === questions.length - 1 ? "Finishing Quiz..." : "Loading...") : 
                (currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next Question")}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
