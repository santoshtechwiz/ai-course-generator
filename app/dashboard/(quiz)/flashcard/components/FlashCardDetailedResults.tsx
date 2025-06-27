import { motion } from "framer-motion";
import { CheckCircle, Activity, AlertCircle, Badge, ThumbsUp, ThumbsDown } from "lucide-react";

  // FlashCardDetailedResults component
  function FlashCardDetailedResults({
    showDetailedResults,
    enhancedAnswers,
    clickedDetailCardIds,
    handleDetailCardClick,
    selectedOption,
    handleOptionSelect,
  }: any) {
    if (!showDetailedResults || enhancedAnswers.length === 0) return null;
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <h3 className="text-2xl font-bold text-center">Detailed Results</h3>
        <div className="space-y-3">
          {enhancedAnswers.map((answer: any, index: number) => {
            const isCorrect = answer.answer === "correct" || answer.isCorrect === true;
            const isStillLearning = answer.answer === "still_learning";
            const isIncorrect = answer.answer === "incorrect" || answer.isCorrect === false;
            const cardId = `${answer.questionId}-${index}`;
            const isCardClicked = clickedDetailCardIds.has(cardId);

            return (
              <motion.div
                key={cardId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  scale: isCardClicked ? 0.98 : 1,
                  boxShadow: isCardClicked ? '0 0 0 3px rgba(0,0,0,0.1)' : 'none'
                }}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDetailCardClick(cardId)}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isCorrect 
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                    : isStillLearning
                    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'                    } ${isCardClicked ? 'ring-2 ring-offset-1 ring-primary/30' : ''} 
                ${selectedOption && String(selectedOption.questionId) === String(answer.questionId) ? 'shadow-lg transform scale-[1.01]' : ''}`}
              >
                <div className="flex items-start gap-3">                      <div className={`mt-1 ${
                    isCorrect 
                      ? 'text-green-500'
                      : isStillLearning
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }`}>
                  <motion.div
                    animate={{
                      scale: selectedOption && 
                             String(selectedOption.questionId) === String(answer.questionId) ? 
                             [1, 1.4, 1] : 1,
                      rotate: selectedOption && 
                              String(selectedOption.questionId) === String(answer.questionId) ? 
                              [0, 15, -15, 0] : 0
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : isStillLearning ? (
                      <Activity className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                  </motion.div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm mb-2">
                    Question {index + 1}
                    {answer.difficulty && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {answer.difficulty}
                      </Badge>
                    )}
                    {answer.saved && (
                      <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700">
                        Saved
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {answer.question}
                  </div>
                  <div className="text-sm">
                    <strong>Answer:</strong> {answer.correctAnswer}
                  </div>                        {answer.timeSpent !== undefined && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Time spent: {answer.timeSpent}s
                    </div>
                  )}
                  
                  {/* Option feedback buttons */}
                  <div className="flex gap-2 mt-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionSelect(answer.questionId, 'correct');
                      }}
                      className={`rounded-full p-1.5 ${
                        isCorrect ? 'bg-green-100 text-green-600 ring-1 ring-green-300' : 'bg-muted/40 hover:bg-green-50 hover:text-green-500'
                      } transition-all`}
                    >
                      <ThumbsUp size={14} />
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionSelect(answer.questionId, 'still_learning');
                      }}
                      className={`rounded-full p-1.5 ${
                        isStillLearning ? 'bg-yellow-100 text-yellow-600 ring-1 ring-yellow-300' : 'bg-muted/40 hover:bg-yellow-50 hover:text-yellow-500'
                      } transition-all`}
                    >
                      <Activity size={14} />
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOptionSelect(answer.questionId, 'incorrect');
                      }}
                      className={`rounded-full p-1.5 ${
                        isIncorrect ? 'bg-red-100 text-red-600 ring-1 ring-red-300' : 'bg-muted/40 hover:bg-red-50 hover:text-red-500'
                      } transition-all`}
                    >
                      <ThumbsDown size={14} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
export default FlashCardDetailedResults;