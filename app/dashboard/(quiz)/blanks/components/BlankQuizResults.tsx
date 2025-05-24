

interface BlankQuizResultsProps {
  result?: {
    quizId: string;
    slug: string;
    title: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    completedAt: string;
  };
}

export const BlankQuizResults: React.FC<BlankQuizResultsProps> = ({ result }) => {
  // Use either passed result or get from Redux state
  const stateResults = useSelector(selectQuizResults);
  const questions = useSelector(selectQuestions);
  const title = useSelector(selectQuizTitle);
  
  // Combine props and state data
  const resultData = result || {
    score: stateResults?.score || 0,
    totalQuestions: questions.length,
    correctAnswers: stateResults?.score || 0,
    completedAt: new Date().toISOString(),
    title: title || 'Fill in the Blanks Quiz'
  };
  
  const percentage = Math.round((resultData.correctAnswers / Math.max(1, resultData.totalQuestions)) * 100);
  
  // Determine result message based on score
  const getResultMessage = () => {
    if (percentage >= 90) return "Excellent! You've mastered this topic.";
    if (percentage >= 70) return "Great job! You have a solid understanding.";
    if (percentage >= 50) return "Good effort! Keep practicing to improve.";
    return "Keep learning! Review the material and try again.";
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">{resultData.title} Results</h1>
        <p className="text-gray-600">
          Completed on {formatDate(resultData.completedAt)}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold">{percentage}%</span>
            </div>
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#eee"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={percentage >= 70 ? "#4CAF50" : percentage >= 40 ? "#FF9800" : "#F44336"}
                strokeWidth="3"
                strokeDasharray={`${percentage}, 100`}
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold mb-1">
              {resultData.correctAnswers} out of {resultData.totalQuestions} correct
            </p>
            <p className="text-gray-600">{getResultMessage()}</p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-3">Performance Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-xl font-semibold">{resultData.correctAnswers}/{resultData.totalQuestions}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Percentage</p>
              <p className="text-xl font-semibold">{percentage}%</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => window.location.href = '/dashboard/quizzes'}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Back to Quizzes
        </button>
        <button
          onClick={() => window.location.href = `/dashboard/blanks/${result?.slug || ''}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};
