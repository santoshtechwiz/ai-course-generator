/**
 * Advanced text similarity calculation for quiz answers
 */

// Levenshtein distance calculation
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  const len1 = str1.length
  const len2 = str2.length

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        )
      }
    }
  }

  return matrix[len2][len1]
}

// Jaro-Winkler similarity
function jaroWinklerSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0

  const len1 = str1.length
  const len2 = str2.length

  if (len1 === 0 || len2 === 0) return 0.0

  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1
  if (matchWindow < 0) return 0.0

  const str1Matches = new Array(len1).fill(false)
  const str2Matches = new Array(len2).fill(false)

  let matches = 0
  let transpositions = 0

  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow)
    const end = Math.min(i + matchWindow + 1, len2)

    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue
      str1Matches[i] = true
      str2Matches[j] = true
      matches++
      break
    }
  }

  if (matches === 0) return 0.0

  // Find transpositions
  let k = 0
  for (let i = 0; i < len1; i++) {
    if (!str1Matches[i]) continue
    while (!str2Matches[k]) k++
    if (str1[i] !== str2[k]) transpositions++
    k++
  }

  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3.0

  // Jaro-Winkler
  if (jaro < 0.7) return jaro

  let prefix = 0
  for (let i = 0; i < Math.min(len1, len2, 4); i++) {
    if (str1[i] === str2[i]) prefix++
    else break
  }

  return jaro + 0.1 * prefix * (1.0 - jaro)
}

// Programming-specific synonyms and concepts
const PROGRAMMING_SYNONYMS: Record<string, string[]> = {
  singleton: ["single instance", "one instance", "single object"],
  orchestration: ["management", "coordination", "automation", "control"],
  container: ["containerized", "containerization", "docker"],
  deployment: ["deploy", "deploying", "release"],
  scaling: ["scale", "scaling up", "scaling down", "autoscaling"],
  kubernetes: ["k8s", "kube"],
  microservices: ["microservice", "micro services", "service oriented"],
  api: ["application programming interface", "interface", "endpoint"],
  database: ["db", "data store", "storage"],
  authentication: ["auth", "login", "authorization"],
}

// Expand text with synonyms
function expandWithSynonyms(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/)
  const expanded = [text.toLowerCase()]

  for (const [key, synonyms] of Object.entries(PROGRAMMING_SYNONYMS)) {
    if (words.some((word) => word.includes(key))) {
      synonyms.forEach((synonym) => {
        expanded.push(text.toLowerCase().replace(new RegExp(key, "gi"), synonym))
      })
    }
  }

  return expanded
}

// Word-level similarity
function wordSimilarity(str1: string, str2: string): number {
  const words1 = str1
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0)
  const words2 = str2
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0)

  if (words1.length === 0 || words2.length === 0) return 0

  let matches = 0
  const used = new Set<number>()

  for (const word1 of words1) {
    for (let i = 0; i < words2.length; i++) {
      if (used.has(i)) continue
      const word2 = words2[i]

      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matches++
        used.add(i)
        break
      }
    }
  }

  return (2 * matches) / (words1.length + words2.length)
}

// Semantic similarity using synonyms
function semanticSimilarity(str1: string, str2: string): number {
  const expanded1 = expandWithSynonyms(str1)
  const expanded2 = expandWithSynonyms(str2)

  let maxSimilarity = 0

  for (const exp1 of expanded1) {
    for (const exp2 of expanded2) {
      const similarity = jaroWinklerSimilarity(exp1, exp2)
      maxSimilarity = Math.max(maxSimilarity, similarity)
    }
  }

  return maxSimilarity
}

// Main similarity calculation
export function calculateAnswerSimilarity(
  userAnswer: string,
  correctAnswer: string,
  threshold = 0.7,
): { similarity: number; isAcceptable: boolean } {
  if (!userAnswer.trim() || !correctAnswer.trim()) {
    return { similarity: 0, isAcceptable: false }
  }

  const user = userAnswer.trim()
  const correct = correctAnswer.trim()

  // Exact match
  if (user.toLowerCase() === correct.toLowerCase()) {
    return { similarity: 1.0, isAcceptable: true }
  }

  // Calculate different similarity metrics
  const levenshtein =
    1 - levenshteinDistance(user.toLowerCase(), correct.toLowerCase()) / Math.max(user.length, correct.length)
  const jaroWinkler = jaroWinklerSimilarity(user.toLowerCase(), correct.toLowerCase())
  const wordSim = wordSimilarity(user, correct)
  const semanticSim = semanticSimilarity(user, correct)

  // Weighted combination
  const similarity = levenshtein * 0.2 + jaroWinkler * 0.3 + wordSim * 0.3 + semanticSim * 0.2

  return {
    similarity: Math.min(1.0, similarity),
    isAcceptable: similarity >= threshold,
  }
}

// Get similarity label
export function getSimilarityLabel(similarity: number): string {
  if (similarity >= 0.9) return "Excellent"
  if (similarity >= 0.8) return "Very Good"
  if (similarity >= 0.7) return "Good"
  if (similarity >= 0.6) return "Fair"
  if (similarity >= 0.4) return "Needs Improvement"
  return "Try Again"
}

// Get similarity feedback
export function getSimilarityFeedback(similarity: number): string {
  if (similarity >= 0.9) return "Perfect! Your answer matches the expected response very closely."
  if (similarity >= 0.8) return "Great job! Your answer is very close to the expected response."
  if (similarity >= 0.7) return "Good work! Your answer captures the main concepts correctly."
  if (similarity >= 0.6) return "You're on the right track, but try to be more specific or complete."
  if (similarity >= 0.4) return "Your answer has some relevant elements, but needs more accuracy."
  return "Please review the question and try to provide a more comprehensive answer."
}

// Check if answer contains key concepts
export function containsKeyConcepts(answer: string, concepts: string[]): boolean {
  const lowerAnswer = answer.toLowerCase()
  return concepts.some((concept) => lowerAnswer.includes(concept.toLowerCase()))
}


export function getPerformanceLevel (similarity: number): "excellent" | "good" | "average" | "poor" {
  if (similarity >= 0.85) return "excellent"
  if (similarity >= 0.7) return "good"
  if (similarity >= 0.5) return "average"
  return "poor"
}