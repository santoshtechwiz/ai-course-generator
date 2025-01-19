"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrismaQuizAttempt } from "@/app/types";
import { CheckCircle2, XCircle, Clock, TrendingUp, ChevronDown, Award, Book, BarChart } from 'lucide-react';

interface QuizAttemptsProps {
  quizAttempts: PrismaQuizAttempt[];
}

export function QuizAttempts({ quizAttempts }: QuizAttemptsProps) {
  if (!quizAttempts || quizAttempts.length === 0) {
    return <p>No quiz attempts available.</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Award className="w-6 h-6 mr-2 text-yellow-500" />
            Recent Quiz Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-6">
            {quizAttempts.map((attempt, index) => (
              <motion.li
                key={attempt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="border rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-semibold flex items-center">
                    <Book className="w-5 h-5 mr-2 text-blue-500" />
                    Quiz ID: {attempt.quizId}
                  </h4>
                  <motion.div
                    className="flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={`text-sm font-medium px-2 py-1 rounded flex items-center ${
                      attempt.score >= 80 ? 'bg-green-100 text-green-800' :
                      attempt.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      <BarChart className="w-4 h-4 mr-1" />
                      Score: {attempt.score}
                    </span>
                  </motion.div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm mb-3">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                    <span>Accuracy: {(attempt.accuracy || 0).toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                    <span>Time: {attempt.timeSpent} seconds</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-purple-500" />
                    <span>Improvement: {attempt.improvement ? `${attempt.improvement.toFixed(2)}%` : 'N/A'}</span>
                  </div>
                </div>
                <details className="group">
                  <summary className="cursor-pointer text-sm text-blue-600 flex items-center hover:text-blue-800 transition-colors duration-200">
                    View Questions
                    <ChevronDown className="w-4 h-4 ml-1 transform transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 space-y-3 bg-gray-50 p-3 rounded-md"
                  >
                    {attempt.attemptQuestions.map((question) => (
                      <li key={question.id} className="text-sm border-b pb-2 last:border-b-0">
                        <p className="font-medium mb-1 flex items-center">
                          <Book className="w-4 h-4 mr-1 text-blue-500" />
                          Question ID: {question.questionId}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <p className="flex items-center">
                            <span className="font-semibold mr-1">Answer:</span> {question.userAnswer}
                          </p>
                          <p className="flex items-center">
                            {question.isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-1 text-red-500" />
                            )}
                            {question.isCorrect ? 'Correct' : 'Incorrect'}
                          </p>
                          <p className="flex items-center">
                            <Clock className="w-4 h-4 mr-1 text-blue-500" />
                            Time: {question.timeSpent}s
                          </p>
                        </div>
                      </li>
                    ))}
                  </motion.ul>
                </details>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}

