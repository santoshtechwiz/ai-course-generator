/**
 * Shuffles an array using the Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  if (!array || !Array.isArray(array)) {
    return []
  }

  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/**
 * Checks if an answer is correct
 */
export function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  if (!userAnswer || !correctAnswer) {
    return false
  }

  // Trim and normalize both answers for comparison
  const normalizedUserAnswer = userAnswer.trim().toLowerCase()
  const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase()

  return normalizedUserAnswer === normalizedCorrectAnswer
}

/**
 * Formats options for display
 */
export function formatOptions(options: string[]): string[] {
  if (!options || !Array.isArray(options)) {
    return []
  }

  return options.map((option) => option.trim())
}

/**
 * Validates a quiz option
 */
export function validateOption(option: string): boolean {
  return !!option && option.trim().length > 0
}

/**
 * Gets the correct option index
 */
export function getCorrectOptionIndex(options: string[], correctAnswer: string): number {
  if (!options || !Array.isArray(options) || !correctAnswer) {
    return -1
  }

  return options.findIndex((option) => isAnswerCorrect(option, correctAnswer))
}

/**
 * Creates a set of options with the correct answer included
 */
export function createOptionsWithCorrectAnswer(
  correctAnswer: string,
  wrongOptions: string[],
  shuffle = true,
): string[] {
  if (!correctAnswer || !wrongOptions || !Array.isArray(wrongOptions)) {
    return []
  }

  const options = [correctAnswer, ...wrongOptions]
  return shuffle ? shuffleArray(options) : options
}
