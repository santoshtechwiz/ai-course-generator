"use client"

import { useState, useEffect, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import React from "react"
import { BlankQuizQuestion } from "@/app/types/quiz-types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { selectQuestions, selectCurrentQuestionIndex, selectAnswers, selectCurrentQuestion, saveAnswer, setCurrentQuestionIndex } from "@/store/slices/quizSlice";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2, Clock, BookOpen } from 'lucide-react';

export function BlanksQuiz() {
  const dispatch = useDispatch();
  
  // Get data from Redux store
  const questions = useSelector(selectQuestions);
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
  const answers = useSelector(selectAnswers);
  const currentQuestion = useSelector(selectCurrentQuestion) as unknown as BlankQuizQuestion;
  
  // Track input values before saving to Redux
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [focusedBlank, setFocusedBlank] = useState<string | null>(null);
  const [completedBlanks, setCompletedBlanks] = useState<Set<string>>(new Set());
  
  // Initialize inputValues from existing answers when component mounts or question changes
  useEffect(() => {
    if (currentQuestion?.id && answers[currentQuestion.id]?.filledBlanks) {
      const filledBlanks = answers[currentQuestion.id].filledBlanks || {};
      setInputValues(filledBlanks);
      setCompletedBlanks(new Set(Object.keys(filledBlanks).filter(key => filledBlanks[key]?.trim())));
    } else {
      setInputValues({});
      setCompletedBlanks(new Set());
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
    
    // Update completed blanks
    setCompletedBlanks(prev => {
      const newSet = new Set(prev);
      if (value.trim()) {
        newSet.add(blankId);
      } else {
        newSet.delete(blankId);
      }
      return newSet;
    });
    
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
      <Card className="max-w-4xl mx-auto shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-foreground">No Questions Available</h2>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              This quiz doesn't have any questions yet, or we couldn't load them. Please try refreshing the page.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate progress
  const progressPercentage = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const totalBlanks = Object.keys(inputValues).length;
  const filledBlanks = completedBlanks.size;
  const questionProgress = totalBlanks > 0 ? (filledBlanks / totalBlanks) * 100 : 0;
  
  // Parse text with blanks from the API response format
  const renderTextWithBlanks = () => {
    const questionText = currentQuestion.question || "";

    // Support [[answer]] format
    if (questionText.match(/\[\[.*?\]\]/)) {
      const regex = /\[\[(.*?)\]\]/g;
      let lastIndex = 0;
      let match;
      let idx = 0;
      const elements: React.ReactNode[] = [];
      while ((match = regex.exec(questionText)) !== null) {
        if (match.index > lastIndex) {
          elements.push(
            <span key={`text-${idx}`} className="text-lg leading-relaxed">
              {questionText.slice(lastIndex, match.index)}
            </span>
          );
        }
        const blankId = `blank_${idx}`;
        const currentValue = inputValues[blankId] || '';
        const isCompleted = completedBlanks.has(blankId);
        const isFocused = focusedBlank === blankId;
        
        elements.push(
          <motion.div
            key={`blank-container-${idx}`}
            className="inline-block relative"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <motion.input
              type="text"
              className={`
                mx-2 px-4 py-2 border-2 rounded-lg bg-background/50 backdrop-blur-sm
                min-w-[120px] max-w-[200px] inline-block text-center font-medium
                transition-all duration-300 ease-in-out
                ${isFocused 
                  ? 'border-primary shadow-lg shadow-primary/20 bg-primary/5' 
                  : isCompleted 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-border hover:border-primary/50'
                }
                focus:outline-none focus:ring-2 focus:ring-primary/20
              `}
              value={currentValue}
              onChange={(e) => handleBlankChange(blankId, e.target.value)}
              onFocus={() => setFocusedBlank(blankId)}
              onBlur={() => setFocusedBlank(null)}
              placeholder="Type here..."
              data-testid={`blank-input-${idx}`}
            />
            {isCompleted && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </motion.div>
        );
        lastIndex = regex.lastIndex;
        idx++;
      }
      if (lastIndex < questionText.length) {
        elements.push(
          <span key={`text-end`} className="text-lg leading-relaxed">
            {questionText.slice(lastIndex)}
          </span>
        );
      }
      return elements;
    }

    // Support underscores and other formats with similar enhancements
    if (questionText.includes("_")) {
      const parts = questionText.split(/(_+)/g);
      return parts.map((part, index) => {
        if (part.match(/^_+$/)) {
          const blankId = `blank_${index}`;
          const currentValue = inputValues[blankId] || '';
          const isCompleted = completedBlanks.has(blankId);
          const isFocused = focusedBlank === blankId;
          
          return (
            <motion.div
              key={`blank-container-${index}`}
              className="inline-block relative"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <motion.input
                type="text"
                className={`
                  mx-2 px-4 py-2 border-2 rounded-lg bg-background/50 backdrop-blur-sm
                  min-w-[120px] max-w-[200px] inline-block text-center font-medium
                  transition-all duration-300 ease-in-out
                  ${isFocused 
                    ? 'border-primary shadow-lg shadow-primary/20 bg-primary/5' 
                    : isCompleted 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-border hover:border-primary/50'
                  }
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                `}
                value={currentValue}
                onChange={(e) => handleBlankChange(blankId, e.target.value)}
                onFocus={() => setFocusedBlank(blankId)}
                onBlur={() => setFocusedBlank(null)}
                placeholder="Type here..."
                data-testid={`blank-input-${index}`}
              />
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.div>
          );
        }
        return (
          <span key={index} data-testid={`text-part-${index}`} className="text-lg leading-relaxed">
            {part}
          </span>
        );
      });
    }
    
    // Support __________
    if (questionText.includes("__________")) {
      const parts = questionText.split(/__________/g);
      return parts.map((part, index) => {
        if (index === parts.length - 1) {
          return (
            <span key={index} data-testid={`text-part-${index}`} className="text-lg leading-relaxed">
              {part}
            </span>
          );
        }
        const blankId = `blank_${index}`;
        const currentValue = inputValues[blankId] || '';
        const isCompleted = completedBlanks.has(blankId);
        const isFocused = focusedBlank === blankId;
        
        return (
          <React.Fragment key={index}>
            <span data-testid={`text-part-${index}`} className="text-lg leading-relaxed">
              {part}
            </span>
            <motion.div
              className="inline-block relative"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <motion.input
                type="text"
                className={`
                  mx-2 px-4 py-2 border-2 rounded-lg bg-background/50 backdrop-blur-sm
                  min-w-[120px] max-w-[200px] inline-block text-center font-medium
                  transition-all duration-300 ease-in-out
                  ${isFocused 
                    ? 'border-primary shadow-lg shadow-primary/20 bg-primary/5' 
                    : isCompleted 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-border hover:border-primary/50'
                  }
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                `}
                value={currentValue}
                onChange={(e) => handleBlankChange(blankId, e.target.value)}
                onFocus={() => setFocusedBlank(blankId)}
                onBlur={() => setFocusedBlank(null)}
                placeholder="Type here..."
                data-testid={`blank-input-${index}`}
              />
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.div>
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
    <AnimatePresence mode="wait">
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="max-w-5xl mx-auto"
      >
        <Card className="shadow-xl border-0 bg-gradient-to-br from-background via-background to-muted/10 overflow-hidden">
          {/* Enhanced Header */}
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/50 p-6">
            <div className="space-y-4">
              {/* Question Counter and Progress */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      Question {currentQuestionIndex + 1}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      of {questions.length} questions
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(progressPercentage)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress 
                  value={progressPercentage} 
                  className="h-3 bg-muted/50"
                />
                
                {/* Question Progress */}
                {totalBlanks > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">
                      Blanks filled: {filledBlanks}/{totalBlanks}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-green-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${questionProgress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className="text-green-600 font-medium">
                        {Math.round(questionProgress)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          {/* Enhanced Content */}
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Question Instructions */}
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/20"
                >
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Fill in the blanks below
                  </span>
                </motion.div>
              </div>
              
              {/* Question Text with Blanks */}
              <motion.div 
                className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-inner"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <div className="text-center leading-relaxed text-foreground min-h-[120px] flex items-center justify-center">
                  <div className="max-w-4xl">
                    {renderTextWithBlanks()}
                  </div>
                </div>
              </motion.div>
              
              {/* Helpful Tips */}
              {totalBlanks > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-muted/30 rounded-xl p-4 border border-border/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Tips for success:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Think about the context of each sentence</li>
                        <li>• Consider grammar and word forms</li>
                        <li>• Check your spelling before moving on</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
          
          {/* Enhanced Navigation */}
          <div className="border-t border-border/50 bg-muted/20 p-6">
            <div className="flex justify-between items-center">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50 transition-all duration-200"
                data-testid="previous-button"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  {Array.from({ length: questions.length }).map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === currentQuestionIndex 
                          ? 'bg-primary scale-125' 
                          : i < currentQuestionIndex 
                            ? 'bg-green-500' 
                            : 'bg-muted'
                      }`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: i === currentQuestionIndex ? 1.25 : 1 }}
                    />
                  ))}
                </div>
              </div>
              
              <Button
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1}
                size="lg"
                className="flex items-center gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-primary/90 transition-all duration-200"
                data-testid="next-button"
              >
                {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}