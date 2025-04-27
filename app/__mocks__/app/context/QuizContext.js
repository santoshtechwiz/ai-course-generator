const React = require("react")
const jest = require("jest-mock")

module.exports = {
  useQuiz: jest.fn().mockReturnValue({
    state: {
      currentQuestionIndex: 0,
      questionCount: 2,
      isLoading: false,
      error: null,
      isCompleted: false,
      answers: [null, null],
      animationState: "idle",
      timeSpentPerQuestion: [0, 0],
    },
    submitAnswer: jest.fn(),
    completeQuiz: jest.fn(),
    restartQuiz: jest.fn(),
    isAuthenticated: false,
  }),
  QuizProvider: function MockQuizProvider(props) {
    return props.children
  },
}

useQuiz.mockReturnValue({
  state: {
    currentQuestionIndex: 0,
    questionCount: 2,
    isLoading: false,
    error: null,
    isCompleted: false,
    answers: [null, null],
    animationState: "idle",
    timeSpentPerQuestion: [0, 0],
  },
  submitAnswer: jest.fn(),
  completeQuiz: jest.fn(),
  restartQuiz: jest.fn(),
  isAuthenticated: false,
})
