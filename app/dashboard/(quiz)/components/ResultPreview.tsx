import React from 'react';
import { useRouter } from 'next/navigation';
import { QuizResults } from '../types';

interface ResultPreviewProps {
  results: QuizResults;
  quizType: 'mcq' | 'code' | 'blanks' | 'openended';
  quizId: string;
}

export const ResultPreview: React.FC<ResultPreviewProps> = ({ 
  results, 
  quizType, 
  quizId 
}) => {
  const router = useRouter();
  
  const { score, maxScore, percentage, questionResults, submittedAt } = results;
  
  // Format submission date
  const formattedDate = new Date(submittedAt).toLocaleString();
  
  // Determine result color based on percentage
  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Navigate to full results page
  const handleViewFullResults = () => {
    router.push(`/${quizType}/${quizId}/results`);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
      
      <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-gray-600">Score</p>
          <p className={`text-3xl font-bold ${getScoreColor()}`}>
            {score}/{maxScore} ({percentage}%)
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-600">Submitted</p>
          <p className="text-gray-800">{formattedDate}</p>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-green-100 rounded-lg">
            <p className="text-sm text-gray-600">Correct</p>
            <p className="text-xl font-bold text-green-600">
              {questionResults.filter(q => q.correct).length}
            </p>
          </div>
          <div className="p-3 bg-red-100 rounded-lg">
            <p className="text-sm text-gray-600">Incorrect</p>
            <p className="text-xl font-bold text-red-600">
              {questionResults.filter(q => !q.correct).length}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-xl font-bold text-blue-600">
              {questionResults.length}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={handleViewFullResults}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Full Results
        </button>
      </div>
    </div>
  );
};
