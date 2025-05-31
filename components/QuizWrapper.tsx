import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface QuizQuestion {
  id: string;
  question: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer: string;
}

export interface QuizWrapperProps {
  title: string;
  questions: QuizQuestion[];
  onComplete?: (results: QuizResult) => void;
  storageKey?: string;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: Record<string, string>;
  correctAnswers: string[];
  answeredCorrectly: string[];
}

export function QuizWrapper({
  title,
  questions,
  onComplete,
  storageKey = "quiz_progress",
}: QuizWrapperProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null);

  // Compute if we're on the last question
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  
  // Current question
  const currentQuestion = questions[currentQuestionIndex];

  // Calculate progress
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Load saved progress from sessionStorage
  useEffect(() => {
    try {
      const savedProgress = sessionStorage.getItem(storageKey);
      if (savedProgress) {
        const { currentIndex, savedAnswers, completed, results } = JSON.parse(savedProgress);
        
        // Only restore if we haven't completed the quiz yet
        if (!completed) {
          setCurrentQuestionIndex(currentIndex);
          setAnswers(savedAnswers || {});
          // Pre-select the answer for the current question if it exists
          if (savedAnswers && savedAnswers[questions[currentIndex]?.id]) {
            setSelectedAnswer(savedAnswers[questions[currentIndex]?.id]);
          }
        } else if (results) {
          // If the quiz was completed, restore the results
          setIsCompleted(true);
          setQuizResults(results);
        }
      }
    } catch (error) {
      console.error("Error restoring quiz progress:", error);
    }
  }, [storageKey, questions]);

  // Save progress to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          currentIndex: currentQuestionIndex,
          savedAnswers: answers,
          completed: isCompleted,
          results: quizResults,
        })
      );
    } catch (error) {
      console.error("Error saving quiz progress:", error);
    }
  }, [currentQuestionIndex, answers, isCompleted, quizResults, storageKey]);

  // Set the selected answer for the current question when navigating between questions
  useEffect(() => {
    if (currentQuestion) {
      const savedAnswer = answers[currentQuestion.id] || null;
      setSelectedAnswer(savedAnswer);
    }
  }, [currentQuestion, answers]);

  // Handle answer selection
  const handleSelectAnswer = (value: string) => {
    setSelectedAnswer(value);
  };

  // Handle "Next" button click
  const handleNextQuestion = () => {
    // Save the current answer
    if (currentQuestion && selectedAnswer) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: selectedAnswer,
      }));
    }

    // Move to the next question if not on the last one
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      // Finish the quiz and calculate results
      finishQuiz();
    }
  };

  // Calculate results and finish the quiz
  const finishQuiz = () => {
    // Make sure the last answer is saved
    const finalAnswers = { ...answers };
    if (currentQuestion && selectedAnswer) {
      finalAnswers[currentQuestion.id] = selectedAnswer;
    }

    // Calculate score
    let correctCount = 0;
    const correctAnswers: string[] = [];
    const answeredCorrectly: string[] = [];

    questions.forEach((q) => {
      correctAnswers.push(q.correctAnswer);
      if (finalAnswers[q.id] === q.correctAnswer) {
        correctCount++;
        answeredCorrectly.push(q.id);
      }
    });

    const results: QuizResult = {
      score: correctCount,
      totalQuestions: questions.length,
      percentage: Math.round((correctCount / questions.length) * 100),
      answers: finalAnswers,
      correctAnswers,
      answeredCorrectly,
    };

    // Update state
    setQuizResults(results);
    setIsCompleted(true);

    // Call the optional callback
    if (onComplete) {
      onComplete(results);
    }
  };

  // Handle restart quiz
  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSelectedAnswer(null);
    setIsCompleted(false);
    setQuizResults(null);
  };

  // If quiz is completed, show results
  if (isCompleted && quizResults) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="inline-flex rounded-full bg-muted p-6 mb-4">
              {quizResults.percentage >= 70 ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-amber-500" />
              )}
            </div>
            <h3 className="text-2xl font-bold">
              {quizResults.score} / {quizResults.totalQuestions} Correct
            </h3>
            <p className="text-muted-foreground">
              You scored {quizResults.percentage}%
            </p>
          </div>

          <Progress value={quizResults.percentage} className="h-3" />

          <div className="space-y-4 pt-4">
            <h4 className="font-medium">Question Summary:</h4>
            {questions.map((question, index) => {
              const userAnswer = quizResults.answers[question.id] || "Not answered";
              const isCorrect = userAnswer === question.correctAnswer;
              const correctOption = question.options.find(
                (opt) => opt.id === question.correctAnswer
              );
              const userSelectedOption = question.options.find(
                (opt) => opt.id === userAnswer
              );

              return (
                <div 
                  key={question.id} 
                  className={`p-4 rounded-lg border ${
                    isCorrect 
                      ? "bg-green-50 border-green-200" 
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <p className="font-medium mb-2">
                    Question {index + 1}: {question.question}
                  </p>
                  <p className={isCorrect ? "text-green-600" : "text-red-600"}>
                    Your answer: {userSelectedOption?.text || "Not answered"}
                  </p>
                  {!isCorrect && (
                    <p className="text-green-600 mt-1">
                      Correct answer: {correctOption?.text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleRestartQuiz} className="w-full">
            Restart Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show the quiz questions
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle>{title}</CardTitle>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentQuestion && (
                <>
                  <h2 className="text-lg font-medium mb-6">
                    {currentQuestion.question}
                  </h2>

                  <RadioGroup 
                    value={selectedAnswer || ""} 
                    onValueChange={handleSelectAnswer}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <RadioGroupItem value={option.id} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-between pt-6">
          <div className="w-full flex justify-end">
            <Button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
              className="px-6"
            >
              {isLastQuestion ? "Finish Quiz" : "Next Question"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
