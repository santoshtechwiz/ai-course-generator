const jest = require("jest-mock")

module.exports = {
  quizStorageService: {
    saveQuizState: jest.fn(),
    getQuizState: jest.fn(),
    clearQuizState: jest.fn(),
    saveQuizResult: jest.fn(),
    isQuizCompleted: jest.fn(),
    saveGuestResult: jest.fn(),
    getGuestResult: jest.fn(),
    clearGuestResult: jest.fn(),
    clearAllQuizData: jest.fn(),
    calculateScore: jest.fn(),
    countCorrectAnswers: jest.fn(),
    getGuestResults: jest.fn(),
  },
}
