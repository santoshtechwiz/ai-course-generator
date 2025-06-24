/**
 * Text Similarity Utilities
 * 
 * This file contains all functions related to text similarity calculations,
 * answer checking, hint generation, and quiz result processing.
 */

//===========================================================================
// CORE TEXT SIMILARITY ALGORITHMS
//===========================================================================

/**
 * Normalize text by trimming, lowercasing, and removing punctuation.
 * @param input The text to normalize
 * @returns Normalized text
 */
export function normalizeText(input: string): string {
  if (typeof input !== 'string') {
    console.warn('normalizeText received non-string input:', input);
    return '';
  }
  
  return input
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "") // remove punctuation
    .replace(/\s+/g, " ") // collapse whitespace
    .trim()
}

/**
 * Levenshtein distance algorithm.
 * Returns the number of edits needed to convert a to b.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] =
          1 +
          Math.min(
            dp[i - 1][j], // deletion
            dp[i][j - 1], // insertion
            dp[i - 1][j - 1], // substitution
          )
      }
    }
  }

  return dp[m][n]
}

/**
 * Calculate normalized similarity score between 0 and 1.
 * A score closer to 1 means more similar.
 */
export function similarityScore(a: string, b: string): number {
  const normA = normalizeText(a)
  const normB = normalizeText(b)

  if (!normA && !normB) return 1
  if (!normA || !normB) return 0

  const distance = levenshteinDistance(normA, normB)
  const maxLen = Math.max(normA.length, normB.length)

  return 1 - distance / maxLen
}

/**
 * Calculate Jaccard similarity between two strings.
 * Measures similarity based on word overlap.
 */
export function jaccardSimilarity(a: string, b: string): number {
  const normA = normalizeText(a)
  const normB = normalizeText(b)

  if (!normA && !normB) return 1
  if (!normA || !normB) return 0

  const wordsA = new Set(normA.split(" "))
  const wordsB = new Set(normB.split(" "))

  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)))
  const union = new Set([...wordsA, ...wordsB])

  return intersection.size / union.size
}

/**
 * Calculate cosine similarity between two strings based on word frequency.
 */
export function cosineSimilarity(a: string, b: string): number {
  const normA = normalizeText(a)
  const normB = normalizeText(b)

  if (!normA && !normB) return 1
  if (!normA || !normB) return 0

  // Get word frequencies
  const getWordFreq = (text: string) => {
    const words = text.split(" ")
    const freq: Record<string, number> = {}
    for (const word of words) {
      if (word) freq[word] = (freq[word] || 0) + 1
    }
    return freq
  }

  const freqA = getWordFreq(normA)
  const freqB = getWordFreq(normB)

  // Get all unique words
  const allWords = new Set([...Object.keys(freqA), ...Object.keys(freqB)])

  // Calculate dot product
  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (const word of allWords) {
    const countA = freqA[word] || 0
    const countB = freqB[word] || 0

    dotProduct += countA * countB
    magnitudeA += countA * countA
    magnitudeB += countB * countB
  }

  magnitudeA = Math.sqrt(magnitudeA)
  magnitudeB = Math.sqrt(magnitudeB)

  if (magnitudeA === 0 || magnitudeB === 0) return 0

  return dotProduct / (magnitudeA * magnitudeB)
}

//===========================================================================
// COMBINED SIMILARITY FUNCTIONS
//===========================================================================

/**
 * Helper to get similarity result with metadata.
 */
export function getTextSimilarity(userAnswer: string, correctAnswer: string) {
  const similarity = similarityScore(userAnswer, correctAnswer)

  return {
    userAnswer,
    correctAnswer,
    similarity: Number.parseFloat(similarity.toFixed(4)), // limit float precision
    isMatch: similarity >= 0.8, // configurable threshold
  }
}

/**
 * Get the best similarity score using multiple algorithms.
 * Returns a percentage (0-100).
 * @param userAnswer User provided answer
 * @param correctAnswer Expected correct answer
 * @returns Similarity score as percentage
 */
export function getBestSimilarityScore(userAnswer: string, correctAnswer: string): number {
  if (typeof userAnswer !== 'string' || typeof correctAnswer !== 'string') {
    console.warn('getBestSimilarityScore received invalid inputs:', { userAnswer, correctAnswer });
    return 0;
  }
  
  if (!userAnswer.trim() || !correctAnswer.trim()) return 0;

  try {
    // Calculate similarity using different methods
    const levenshtein = similarityScore(userAnswer, correctAnswer);
    const jaccard = jaccardSimilarity(userAnswer, correctAnswer);
    const cosine = cosineSimilarity(userAnswer, correctAnswer);

    // Use the highest score (most favorable to the user)
    const bestScore = Math.max(levenshtein, jaccard, cosine);

    // Convert to percentage
    return Math.round(bestScore * 100);
  } catch (error) {
    console.error('Error calculating similarity score:', error);
    return 0;
  }
}

/**
 * Get detailed similarity analysis using multiple algorithms.
 */
export function getDetailedSimilarityAnalysis(userAnswer: string, correctAnswer: string) {
  const levenshtein = similarityScore(userAnswer, correctAnswer)
  const jaccard = jaccardSimilarity(userAnswer, correctAnswer)
  const cosine = cosineSimilarity(userAnswer, correctAnswer)
  const bestScore = Math.max(levenshtein, jaccard, cosine)

  return {
    userAnswer,
    correctAnswer,
    scores: {
      levenshtein: Math.round(levenshtein * 100),
      jaccard: Math.round(jaccard * 100),
      cosine: Math.round(cosine * 100),
    },
    bestScore: Math.round(bestScore * 100),
    isMatch: bestScore >= 0.8,
  }
}

//===========================================================================
// ANSWER EVALUATION FUNCTIONS
//===========================================================================

/**
 * Determines if a user answer is close enough to the correct answer
 * to be considered acceptable
 *
 * @param userInput The user's provided answer
 * @param correctAnswer The expected correct answer
 * @param threshold Similarity threshold percentage (default: 80)
 * @returns boolean indicating if the answer is close enough
 */
export function isAnswerCloseEnough(
  userInput: string,
  correctAnswer: string,
  threshold: number = 80,
): boolean {
  if (typeof userInput !== 'string' || typeof correctAnswer !== 'string') {
    return false;
  }
  
  if (!userInput.trim() || !correctAnswer.trim()) return false;

  try {
    // Get similarity score (as percentage 0-100)
    const score = getBestSimilarityScore(userInput, correctAnswer);

    // Return true if the similarity meets or exceeds the threshold
    return score >= threshold;
  } catch (error) {
    console.error('Error in isAnswerCloseEnough:', error);
    return false;
  }
}

/**
 * Calculates similarity score and determines if an answer is correct based on thresholds
 * @param userAnswer The user's answer
 * @param correctAnswer The correct answer
 * @returns Object with similarity score and correctness indicators
 */
export function calculateAnswerSimilarity(userAnswer: string, correctAnswer: string) {
  // Get similarity score between 0-1
  const similarity = similarityScore(userAnswer || "", correctAnswer || "")

  // Determine correctness based on thresholds:
  // - 90%+ similarity: Fully correct (1 point)
  // - 70-90% similarity: Partially correct (0.5 points)
  // - Below 70%: Incorrect (0 points)
  const isFullyCorrect = similarity >= 0.9
  const isPartiallyCorrect = similarity >= 0.7 && similarity < 0.9
  const isIncorrect = similarity < 0.7

  // Calculate points (1.0 for fully correct, 0.5 for partially correct)
  const points = isFullyCorrect ? 1 : isPartiallyCorrect ? 0.5 : 0

  // Get appropriate feedback label
  let similarityLabel = ""
  if (isFullyCorrect) similarityLabel = "Correct"
  else if (isPartiallyCorrect) similarityLabel = "Almost Correct"
  else if (similarity >= 0.5) similarityLabel = "Close"
  else similarityLabel = "Incorrect"

  return {
    similarity,
    similarityLabel,
    isFullyCorrect,
    isPartiallyCorrect, 
    isIncorrect,
    isCorrect: similarity >= 0.7, // Legacy boolean for backward compatibility
    points,
  }
}

/**
 * Get similarity feedback message based on similarity score
 * @param similarity Similarity score (0-1)
 * @returns Feedback message
 */
export function getSimilarityFeedback(similarity: number): string {
  if (similarity >= 0.9) return "Your answer matches perfectly!"
  if (similarity >= 0.85) return "Your answer is very close to correct!"
  if (similarity >= 0.8) return "Your answer is close enough to be correct!"
  if (similarity >= 0.7) return "Your answer has the right idea but could be more precise."
  if (similarity >= 0.6) return "Your answer contains some correct elements."
  if (similarity >= 0.5) return "Your answer is getting close but needs improvement."
  if (similarity >= 0.4) return "Your answer shows some understanding of the concept."
  if (similarity >= 0.3) return "Your answer is partially on track but needs work."
  return "Your answer needs significant improvement."
}

/**
 * Convert a similarity score to a user-friendly label
 */
export function getSimilarityLabel(similarity: number) {
  if (similarity >= 0.9) return "Correct"
  if (similarity >= 0.7) return "Almost Correct"
  if (similarity >= 0.5) return "Close"
  if (similarity >= 0.3) return "Somewhat Related"
  return "Incorrect"
}

//===========================================================================
// QUIZ RESULT PROCESSING FUNCTIONS
//===========================================================================

/**
 * Recalculate quiz score with partial credit for "almost correct" answers
 * @param questionResults Array of question results with similarity scores
 * @returns Updated score information
 */
export function calculateQuizScoreWithPartialCredit(questionResults: Array<any>) {
  let totalPoints = 0
  let maxPossiblePoints = questionResults.length

  questionResults.forEach(result => {
    // For each question, add points based on similarity
    const similarity = result.similarity || 0
    
    if (similarity >= 0.9) {
      // Full credit (100%)
      totalPoints += 1.0
    } else if (similarity >= 0.7) {
      // Partial credit (50%)
      totalPoints += 0.5
    }
    // Otherwise no points (0%)
  })

  const percentage = Math.round((totalPoints / maxPossiblePoints) * 100)
  
  return {
    score: percentage,
    totalPoints,
    maxPossiblePoints,
    percentage
  }
}

/**
 * Determines the performance level based on percentage score
 */
export function getPerformanceLevel(percentage: number) {
  if (percentage >= 90)
    return {
      level: "Excellent",
      message: "Outstanding! You've mastered this topic.",
      color: "text-green-500",
      bgColor: "bg-green-50", 
      borderColor: "border-green-200",
      emoji: "🏆",
    }
  if (percentage >= 80)
    return {
      level: "Very Good",
      message: "Great job! You have strong understanding.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      emoji: "🎯",
    }
  if (percentage >= 70)
    return {
      level: "Good",
      message: "Well done! Your knowledge is solid.",
      color: "text-green-500", 
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "✅",
    }
  if (percentage >= 60)
    return {
      level: "Satisfactory",
      message: "Good effort! Keep studying to improve.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      emoji: "📚",
    }
  if (percentage >= 50)
    return {
      level: "Needs Improvement",
      message: "You're making progress. More study needed.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      emoji: "💪",
    }
  return {
    level: "Study Required",
    message: "Keep learning! Review the material thoroughly.",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    emoji: "📖",
  }
}

/**
 * Calculate whether an answer should receive credit based on similarity score
 * and determine the color and visual indicators
 */
export function getAnswerVisualElements(similarity: number) {
  if (similarity >= 0.9) {
    return {
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      label: "Correct",
      emoji: "✓",
      isCorrect: true,
      isPartiallyCorrect: false
    }
  } else if (similarity >= 0.7) {
    return {
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200", 
      textColor: "text-blue-700",
      label: "Almost Correct",
      emoji: "~",
      isCorrect: false,
      isPartiallyCorrect: true
    }
  } else if (similarity >= 0.5) {
    return {
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-700", 
      label: "Close",
      emoji: "⚠️",
      isCorrect: false,
      isPartiallyCorrect: false
    }
  } else {
    return {
      color: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-700",
      label: "Incorrect",
      emoji: "✗",
      isCorrect: false, 
      isPartiallyCorrect: false
    }
  }
}

/**
 * Process a raw answer object to ensure consistent presentation and scoring
 * across all quiz types
 */
export function processQuizAnswer({
  userAnswer,
  correctAnswer,
  isCorrect,
  similarity
}: {
  userAnswer: string;
  correctAnswer: string;
  isCorrect?: boolean;
  similarity?: number;
}) {
  // Calculate similarity if not provided
  const simScore = similarity !== undefined ? similarity : 
    calculateAnswerSimilarity(userAnswer, correctAnswer).similarity;
  
  // Determine correctness based on similarity if not explicitly set
  const isAnswerCorrect = isCorrect !== undefined ? isCorrect : simScore >= 0.7;
  
  // Generate visual elements and feedback based on similarity
  const visuals = getAnswerVisualElements(simScore);
  
  return {
    userAnswer,
    correctAnswer,
    similarity: simScore,
    isCorrect: isAnswerCorrect,
    similarityLabel: getSimilarityLabel(simScore),
    feedback: getSimilarityFeedback(simScore),
    visualElements: visuals,
    points: simScore >= 0.9 ? 1 : simScore >= 0.7 ? 0.5 : 0
  };
}

//===========================================================================
// HINT GENERATION FUNCTIONS
//===========================================================================

/**
 * Generates a hint for a correct answer
 *
 * @param correctAnswer The correct answer to create a hint for
 * @param hintLevel The hint level (0-2), with higher levels revealing more
 * @returns A string containing a hint
 */
export function getHint(correctAnswer: string, hintLevel: number = 0): string {
  if (typeof correctAnswer !== 'string' || !correctAnswer.trim()) {
    return "No hint available";
  }

  try {
    // Normalize the answer for hint generation
    const answer = normalizeText(correctAnswer);
    
    // Handle ultra-short answers specially
    if (answer.length <= 2) {
      return hintLevel > 0 ? 
        `A ${answer.length}-letter word starting with '${answer[0]}'` : 
        `A very short answer (${answer.length} letters)`;
    }

    switch (hintLevel) {
      case 0:
        // Level 0: First letter hint
        return `Starts with '${answer[0].toUpperCase()}'`;

      case 1:
        // Level 1: Masked word with some letters revealed
        return generateMaskedWord(answer);

      case 2:
        // Level 2: First and last letters + length
        return `${answer[0].toUpperCase()}${"_".repeat(Math.max(0, answer.length - 2))}${answer[answer.length - 1]} (${answer.length} letters)`;

      default:
        return `An answer with ${answer.length} letters`;
    }
  } catch (error) {
    console.error('Error generating hint:', error);
    return "Hint unavailable";
  }
}

/**
 * Helper function to generate a masked word with some strategic letter reveals
 *
 * @param word The word to mask
 * @returns A masked version of the word with some letters revealed
 */
function generateMaskedWord(word: string): string {
  if (word.length <= 2) {
    return `${word[0]} _ `
  }

  const maskedChars = word.split("").map((char, index) => {
    // Always reveal the first letter
    if (index === 0) return char.toUpperCase()

    // For longer words, reveal vowels or every third character
    if (word.length > 4) {
      if ("aeiou".includes(char.toLowerCase()) || index % 3 === 0) {
        return char
      }
    }
    // For shorter words, just reveal first letter and a middle letter
    else if (index === Math.floor(word.length / 2)) {
      return char
    }

    return "_"
  })

  // Join with spaces for better readability
  return maskedChars.join(" ")
}
