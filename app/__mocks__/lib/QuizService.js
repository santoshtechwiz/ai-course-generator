const jest = require("jest-mock")

export const quizService = {
  saveQuizState: jest.fn(),
  getQuizState: jest.fn(),
  clearQuizState: jest.fn(),
  saveCompleteQuizResult: jest.fn(),
  saveAuthRedirect: jest.fn(),
  handleAuthRedirect: jest.fn(),
  isAuthenticated: jest.fn().mockReturnValue(false),
  getCurrentUserId: jest.fn(),
  saveQuizResult: jest.fn(),
  isQuizCompleted: jest.fn(),
  saveGuestResult: jest.fn(),
  getGuestResult: jest.fn(),
  clearGuestResult: jest.fn(),
  clearAllQuizData: jest.fn(),
  calculateScore: jest.fn(),
  countCorrectAnswers: jest.fn(),
  getAllQuizResults: jest.fn(),
  submitQuizResult: jest.fn(),
  getQuizResult: jest.fn(),
  clearCache: jest.fn(),
}
