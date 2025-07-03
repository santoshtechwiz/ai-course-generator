// lib/spam-detection.ts

interface SpamCheckResult {
  isSpam: boolean
  reason?: string
}

/**
 * Checks if a message might be spam based on various heuristics
 */
export function checkForSpam(message: string): SpamCheckResult {
  // Convert to string and trim
  const text = String(message).trim()
  
  // Check if message is empty
  if (!text) {
    return { isSpam: true, reason: 'Empty message' }
  }
  
  // Check for excessive length
  if (text.length > 1000) {
    return { isSpam: true, reason: 'Message too long' }
  }
  
  // Check for excessive capitalization (shouting)
  const capitalLetters = text.replace(/[^A-Z]/g, '').length
  const letters = text.replace(/[^a-zA-Z]/g, '').length
  if (letters > 10 && capitalLetters / letters > 0.7) {
    return { isSpam: true, reason: 'Excessive capitalization' }
  }
  
  // Check for excessive repetition of characters
  const repeatedChars = /(.)\1{10,}/
  if (repeatedChars.test(text)) {
    return { isSpam: true, reason: 'Repeated characters' }
  }
  
  // Check for URL spam
  const urlCount = (text.match(/(http|https|www\.)/gi) || []).length
  if (urlCount > 3) {
    return { isSpam: true, reason: 'Too many URLs' }
  }
  
  // Check for repeated words or phrases
  const words = text.toLowerCase().split(/\s+/)
  const repeatedPhrases = findRepeatedPhrases(words, 3, 4) // Look for 3-word phrases repeated 4+ times
  if (repeatedPhrases.length > 0) {
    return { isSpam: true, reason: 'Repeated phrases' }
  }

  return { isSpam: false }
}

/**
 * Find repeated phrases in an array of words
 * @param words Array of words
 * @param phraseLength Length of phrases to check for repetition
 * @param minOccurrences Minimum number of occurrences to be considered spam
 */
function findRepeatedPhrases(
  words: string[],
  phraseLength: number = 3,
  minOccurrences: number = 4
): string[] {
  if (words.length < phraseLength * minOccurrences) return []
  
  const phraseCounts = new Map<string, number>()
  
  for (let i = 0; i <= words.length - phraseLength; i++) {
    const phrase = words.slice(i, i + phraseLength).join(' ')
    phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1)
  }
  
  return Array.from(phraseCounts.entries())
    .filter(([_, count]) => count >= minOccurrences)
    .map(([phrase]) => phrase)
}
