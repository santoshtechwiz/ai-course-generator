/**
 * Utility functions for calculating similarity between text answers
 */

/**
 * Calculate Jaccard similarity between two strings
 * Returns a score between 0 (no similarity) and 1 (identical)
 */
export function calculateJaccardSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  // Normalize and tokenize
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);
  
  // Empty sets case
  if (tokens1.length === 0 && tokens2.length === 0) return 1;
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  
  // Find intersection and union
  const intersection = tokens1.filter(token => tokens2.includes(token));
  const union = Array.from(new Set([...tokens1, ...tokens2]));
  
  // Calculate Jaccard similarity
  return intersection.length / union.length;
}

/**
 * Calculate cosine similarity between two strings
 * Returns a score between 0 (no similarity) and 1 (identical)
 */
export function calculateCosineSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  // Normalize and tokenize
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);
  
  // Empty sets case
  if (tokens1.length === 0 && tokens2.length === 0) return 1;
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  
  // Create term frequency maps
  const tf1 = calculateTermFrequency(tokens1);
  const tf2 = calculateTermFrequency(tokens2);
  
  // Calculate dot product
  let dotProduct = 0;
  Object.keys(tf1).forEach(term => {
    if (term in tf2) {
      dotProduct += tf1[term] * tf2[term];
    }
  });
  
  // Calculate magnitudes
  const magnitude1 = Math.sqrt(Object.values(tf1).reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(Object.values(tf2).reduce((sum, val) => sum + val * val, 0));
  
  // Calculate cosine similarity
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Calculate keyword-based similarity
 * Returns a score between 0 (no matches) and 1 (all keywords present)
 */
export function calculateKeywordSimilarity(text: string, keywords: string[]): number {
  if (!text || !keywords || keywords.length === 0) return 0;
  
  // Normalize and tokenize
  const tokens = tokenize(text);
  
  // Count matched keywords
  const matchedKeywords = keywords.filter(keyword => 
    tokens.includes(keyword.toLowerCase())
  );
  
  // Calculate similarity as proportion of matched keywords
  return matchedKeywords.length / keywords.length;
}

/**
 * Calculate a composite similarity score using multiple methods
 */
export function calculateCompositeSimilarity(
  userAnswer: string, 
  correctAnswer: string, 
  keywords?: string[]
): number {
  // Calculate different similarity scores
  const jaccardScore = calculateJaccardSimilarity(userAnswer, correctAnswer);
  const cosineScore = calculateCosineSimilarity(userAnswer, correctAnswer);
  
  // Calculate keyword similarity if keywords are provided
  const keywordScore = keywords && keywords.length > 0
    ? calculateKeywordSimilarity(userAnswer, keywords)
    : 0;
  
  // Choose the best approach based on available data
  if (keywords && keywords.length > 0) {
    // Weight keyword matching more heavily when keywords are provided
    return 0.2 * jaccardScore + 0.3 * cosineScore + 0.5 * keywordScore;
  } else {
    // Use a balanced approach when no keywords are provided
    return 0.4 * jaccardScore + 0.6 * cosineScore;
  }
}

/**
 * Evaluate if an answer is correct based on similarity
 */
export function evaluateAnswer(
  userAnswer: string,
  correctAnswer: string,
  threshold: number = 0.6,
  keywords?: string[]
): { isCorrect: boolean; similarity: number } {
  const similarity = calculateCompositeSimilarity(userAnswer, correctAnswer, keywords);
  return {
    similarity,
    isCorrect: similarity >= threshold
  };
}

// Helper functions

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
  // Convert to lowercase, remove punctuation, and split into words
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Calculate term frequency
 */
function calculateTermFrequency(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });
  return tf;
}
