export const mockQuizData = {
  id: 'quiz-123',
  title: 'Test MCQ Quiz',
  slug: 'test-mcq-quiz',
  type: 'mcq',
  questions: [
    {
      id: 'q1',
      question: 'What is React?',
      options: ['A library', 'A framework', 'A language', 'An operating system'],
      correctAnswer: 'A library',
      type: 'mcq'
    },
    {
      id: 'q2',
      question: 'What does JSX stand for?',
      options: ['JavaScript XML', 'JavaScript Extension', 'Java Syntax Extension', 'JavaScript Extra'],
      correctAnswer: 'JavaScript XML',
      type: 'mcq'
    },
    {
      id: 'q3',
      question: 'Which hook is used for side effects?',
      options: ['useEffect', 'useState', 'useContext', 'useReducer'],
      correctAnswer: 'useEffect',
      type: 'mcq'
    }
  ],
  isPublic: true,
  timeLimit: 10
};

export const mockCodeQuizData = {
  id: 'quiz-456',
  title: 'Test Code Quiz',
  slug: 'test-code-quiz',
  type: 'code',
  questions: [
    {
      id: 'c1',
      question: 'Write a function that adds two numbers',
      codeSnippet: 'function add(a, b) {\n  // Your code here\n}',
      correctAnswer: 'return a + b',
      language: 'javascript',
      type: 'code'
    },
    {
      id: 'c2',
      question: 'Create a React functional component',
      codeSnippet: 'function MyComponent() {\n  // Your code here\n}',
      correctAnswer: 'return <div></div>',
      language: 'javascript',
      type: 'code'
    },
    {
      id: 'c3',
      question: 'Write a CSS selector for all paragraph elements',
      codeSnippet: '/* Your code here */',
      correctAnswer: 'p',
      language: 'css',
      type: 'code'
    }
  ],
  isPublic: true,
  timeLimit: 15
};

export const mockSubmission = {
  quizId: 'quiz-123',
  answers: [
    {
      questionId: 'q1',
      answer: 'A library',
      isCorrect: true,
      timeSpent: 30
    },
    {
      questionId: 'q2',
      answer: 'JavaScript Extension',
      isCorrect: false,
      timeSpent: 45
    },
    {
      questionId: 'q3',
      answer: 'useEffect',
      isCorrect: true,
      timeSpent: 25
    }
  ],
  type: 'mcq',
  score: 2,
  totalTime: 100,
  totalQuestions: 3,
  correctAnswers: 2
};

export const mockCodeSubmission = {
  quizId: 'quiz-456',
  answers: [
    {
      questionId: 'c1',
      answer: 'return a + b',
      isCorrect: true,
      timeSpent: 60
    },
    {
      questionId: 'c2',
      answer: 'return <div>Hello</div>',
      isCorrect: true,
      timeSpent: 90
    },
    {
      questionId: 'c3',
      answer: 'p { color: red; }',
      isCorrect: false,
      timeSpent: 45
    }
  ],
  type: 'code',
  score: 2,
  totalTime: 195,
  totalQuestions: 3,
  correctAnswers: 2
};

// Special formats for test expectations
export const expectedTestPayloadFormat = {
  slug: "test-quiz",
  quizId: "test-quiz",
  type: "mcq",
  answers: [
    { 
      questionId: "q1",
      answer: "Option 1",
      isCorrect: false,
      timeSpent: 60
    }
  ],
  timeTaken: 60, // Use timeTaken property instead of totalTime for tests
};
