"use client";

import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { 
  selectQuizState, 
  selectCurrentQuestionIndex, 
  selectQuestions,
  selectAnswers
} from "@/store/slices/quizSlice";

export function QuizDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const quizState = useSelector(selectQuizState);
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
  const questions = useSelector(selectQuestions);
  const answers = useSelector(selectAnswers);
  
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs"
      >
        {isVisible ? "Hide Debug" : "Debug Quiz"}
      </button>
      
      {isVisible && (
        <div className="bg-black/90 text-white p-4 mt-2 rounded-md w-80 max-h-96 overflow-auto text-xs">
          <div className="mb-2 pb-2 border-b border-white/20">
            <div className="font-bold">Question: {currentQuestionIndex + 1}/{questions.length}</div>
            <div>Status: {quizState.status}</div>
            <div>Answers: {Object.keys(answers).length}</div>
          </div>
          
          <details>
            <summary className="cursor-pointer">Full State</summary>
            <pre className="text-xs mt-2 whitespace-pre-wrap">
              {JSON.stringify({
                currentIndex: currentQuestionIndex,
                currentQuestion: questions[currentQuestionIndex],
                status: quizState.status,
                answersCount: Object.keys(answers).length,
                isCompleted: quizState.isCompleted,
              }, null, 2)}
            </pre>
          </details>
          
          <div className="mt-2">
            <button 
              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-xs w-full"
              onClick={() => {
                console.log("Quiz State:", quizState);
                console.log("Questions:", questions);
                console.log("Answers:", answers);
              }}
            >
              Log to Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
