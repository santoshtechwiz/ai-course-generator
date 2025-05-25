
// Helper function to calculate local results for MCQ quizzes
export const calculateMCQResults = (questions, answers) => {
  let score = 0;
  const maxScore = questions.length;
  
  const questionResults = questions.map(question => {
    const answer = Object.values(answers).find(a => a.questionId === question.id);
    
    if (!answer) {
      return { 
        questionId: question.id, 
        correct: false, 
        feedback: 'No answer provided' 
      };
    }
    
    const correct = answer.selectedOptionId === question.correctOptionId;
    if (correct) score++;
    
    return {
      questionId: question.id,
      correct,
      feedback: correct ? 'Correct answer!' : 'Incorrect answer'
    };
  });

  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    questionResults,
    submittedAt: Date.now()
  };
};

// Helper function to create MCQ results preview for unauthenticated users
export const createMCQResultsPreview = (questions, answers, quizTitle, slug) => {
  const questionResults = questions.map(q => {
    const answer = Object.values(answers).find(a => a.questionId === q.id);
    
    // Find the selected option from the question options
    const selectedOption = q.options && Array.isArray(q.options) ? 
      q.options.find(o => {
        if (typeof o === 'string') {
          return o === answer?.selectedOptionId;
        }
        return o.id === answer?.selectedOptionId;
      }) : undefined;
    
    // Find the correct option
    const correctOption = q.options && Array.isArray(q.options) ?
      q.options.find(o => {
        if (typeof o === 'string') {
          return o === q.correctOptionId || o === q.correctAnswer;
        }
        return o.id === q.correctOptionId || o.text === q.correctAnswer;
      }) : undefined;
    
    // Determine if the answer is correct
    const isCorrect = answer?.selectedOptionId === q.correctOptionId || 
                      answer?.selectedOptionId === q.correctAnswer;
    
    // Create the question result object
    return {
      id: q.id,
      question: q.text || q.question || '',
      userAnswer: typeof selectedOption === 'string' ? 
        selectedOption : 
        selectedOption?.text || answer?.selectedOptionId || 'Not answered',
      correctAnswer: typeof correctOption === 'string' ? 
        correctOption : 
        correctOption?.text || q.correctAnswer || q.correctOptionId || '',
      isCorrect: !!isCorrect
    };
  });
  
  // Calculate score
  const score = questionResults.filter(q => q.isCorrect).length;
  
  // Create preview object
  return {
    title: quizTitle || "",
    score,
    maxScore: questions.length,
    percentage: Math.round((score / questions.length) * 100),
    questions: questionResults,
    slug
  };
};

// Helper function to calculate local results for Blanks quizzes
export const calculateBlanksResults = (questions, answers) => {
  let score = 0;
  const maxScore = questions.length;
  
  const questionResults = questions.map(question => {
    const answer = Object.values(answers).find(a => a.questionId === question.id);
    
    if (!answer) {
      return { 
        questionId: question.id, 
        correct: false, 
        feedback: 'No answer provided' 
      };
    }
    
    // Check if all blanks are filled correctly
    const correct = question.blanks.every(blank =>
      answer.filledBlanks[blank.id]?.toLowerCase() === blank.correctAnswer.toLowerCase()
    );
    
    if (correct) score++;
    
    return {
      questionId: question.id,
      correct,
      feedback: correct ? 'All blanks filled correctly!' : 'Some blanks are incorrect'
    };
  });

  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    questionResults,
    submittedAt: Date.now()
  };
};

// Helper function to calculate local results for OpenEnded quizzes
export const calculateOpenEndedResults = (questions, answers) => {
  // For open-ended questions, we can't accurately grade locally
  // We'll mark them as "needs review" and provide feedback
  
  const questionResults = questions.map(question => {
    const answer = Object.values(answers).find(a => a.questionId === question.id);
    
    if (!answer) {
      return { 
        questionId: question.id, 
        correct: false, 
        feedback: 'No answer provided' 
      };
    }
    
    return {
      questionId: question.id,
      correct: false, // Assume needs review
      feedback: 'Your answer has been recorded and needs review',
      answer: answer.text
    };
  });

  return {
    score: 0, // Can't determine score automatically
    maxScore: questions.length,
    percentage: 0,
    questionResults,
    submittedAt: Date.now(),
    needsReview: true
  };
};

// Helper function to calculate local results for Document quizzes
export const calculateDocumentResults = (questions, answers) => {
  let score = 0;
  const maxScore = questions.length;
  
  const questionResults = questions.map(question => {
    const answer = Object.values(answers).find(a => a.questionId === question.id);
    
    if (!answer) {
      return { 
        questionId: question.id, 
        correct: false, 
        feedback: 'No answer provided' 
      };
    }
    
    // For document quizzes, each question might have its own structure
    // This is a simplified version assuming MCQ-style questions
    const correct = answer.selectedOptionId === question.correctOptionId;
    if (correct) score++;
    
    return {
      questionId: question.id,
      correct,
      feedback: correct ? 'Correct answer!' : 'Incorrect answer'
    };
  });

  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    questionResults,
    submittedAt: Date.now()
  };
};
