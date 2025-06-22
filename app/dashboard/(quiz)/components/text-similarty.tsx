// Enhanced text similarity algorithm with multiple scoring methods
import { distance as levenshteinDistance } from 'fastest-levenshtein';

export interface SimilarityResult {
  score: number;
  confidence: number;
  method: string;
  suggestions?: string[];
}

export class AdvancedTextSimilarity {
  private static stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'the', 'this', 'these', 'those'
  ]);

  // Normalize text for comparison
  private static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  // Remove stop words
  private static removeStopWords(text: string): string {
    return text
      .split(' ')
      .filter(word => !this.stopWords.has(word))
      .join(' ');
  }

  // Jaro-Winkler similarity
  private static jaroWinklerSimilarity(s1: string, s2: string): number {
    const jaro = this.jaroSimilarity(s1, s2);
    
    if (jaro < 0.7) return jaro;
    
    // Calculate common prefix length (up to 4 characters)
    let prefixLength = 0;
    for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
      if (s1[i] === s2[i]) prefixLength++;
      else break;
    }
    
    return jaro + (0.1 * prefixLength * (1 - jaro));
  }

  private static jaroSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    if (matchWindow < 0) return 0.0;

    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, s2.length);

      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    return (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3.0;
  }

  // Cosine similarity using n-grams
  private static cosineSimilarity(s1: string, s2: string, n: number = 2): number {
    const ngrams1 = this.getNGrams(s1, n);
    const ngrams2 = this.getNGrams(s2, n);
    
    const allNgrams = new Set([...ngrams1.keys(), ...ngrams2.keys()]);
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (const ngram of allNgrams) {
      const freq1 = ngrams1.get(ngram) || 0;
      const freq2 = ngrams2.get(ngram) || 0;
      
      dotProduct += freq1 * freq2;
      norm1 += freq1 * freq1;
      norm2 += freq2 * freq2;
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) || 0;
  }

  private static getNGrams(text: string, n: number): Map<string, number> {
    const ngrams = new Map<string, number>();
    
    for (let i = 0; i <= text.length - n; i++) {
      const ngram = text.substring(i, i + n);
      ngrams.set(ngram, (ngrams.get(ngram) || 0) + 1);
    }
    
    return ngrams;
  }

  // Longest Common Subsequence similarity
  private static lcsSimilarity(s1: string, s2: string): number {
    const lcsLength = this.longestCommonSubsequence(s1, s2);
    return (2.0 * lcsLength) / (s1.length + s2.length);
  }

  private static longestCommonSubsequence(s1: string, s2: string): number {
    const dp = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1).fill(0));
    
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    return dp[s1.length][s2.length];
  }

  // Semantic similarity (word order matters less)
  private static semanticSimilarity(s1: string, s2: string): number {
    const words1 = new Set(s1.split(' '));
    const words2 = new Set(s2.split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  // Generate smart suggestions based on partial input
  public static generateSuggestions(userInput: string, correctAnswer: string): string[] {
    const normalized = this.normalizeText(userInput);
    const normalizedCorrect = this.normalizeText(correctAnswer);
    
    const suggestions: string[] = [];
    
    // If input is very short, suggest completions
    if (normalized.length < normalizedCorrect.length * 0.3) {
      // Find words in correct answer that start with user input
      const correctWords = normalizedCorrect.split(' ');
      for (const word of correctWords) {
        if (word.startsWith(normalized) || normalized.startsWith(word.substring(0, Math.min(word.length, normalized.length)))) {
          suggestions.push(word);
        }
      }
    }
    
    // Add partial matches
    if (normalized.length > 2) {
      const correctWords = normalizedCorrect.split(' ');
      for (const word of correctWords) {
        if (this.jaroWinklerSimilarity(normalized, word) > 0.6) {
          suggestions.push(word);
        }
      }
    }
    
    return [...new Set(suggestions)].slice(0, 3);
  }

  // Main similarity calculation with multiple methods
  public static calculateSimilarity(userAnswer: string, correctAnswer: string): SimilarityResult {
    if (!userAnswer || !correctAnswer) {
      return { score: 0, confidence: 1, method: 'empty' };
    }

    const normalized1 = this.normalizeText(userAnswer);
    const normalized2 = this.normalizeText(correctAnswer);
    
    // Exact match
    if (normalized1 === normalized2) {
      return { score: 1, confidence: 1, method: 'exact' };
    }

    // Multiple similarity methods
    const levenshtein = 1 - (levenshteinDistance(normalized1, normalized2) / Math.max(normalized1.length, normalized2.length));
    const jaroWinkler = this.jaroWinklerSimilarity(normalized1, normalized2);
    const cosine = this.cosineSimilarity(normalized1, normalized2);
    const lcs = this.lcsSimilarity(normalized1, normalized2);
    const semantic = this.semanticSimilarity(normalized1, normalized2);
    
    // Remove stop words and try again for better semantic matching
    const withoutStop1 = this.removeStopWords(normalized1);
    const withoutStop2 = this.removeStopWords(normalized2);
    const semanticNoStop = withoutStop1 && withoutStop2 ? this.semanticSimilarity(withoutStop1, withoutStop2) : 0;
    
    // Weighted combination of methods
    const weights = {
      levenshtein: 0.25,
      jaroWinkler: 0.30,
      cosine: 0.20,
      lcs: 0.15,
      semantic: 0.10
    };
    
    const weightedScore = 
      levenshtein * weights.levenshtein +
      jaroWinkler * weights.jaroWinkler +
      cosine * weights.cosine +
      lcs * weights.lcs +
      Math.max(semantic, semanticNoStop) * weights.semantic;
    
    // Calculate confidence based on consistency of methods
    const scores = [levenshtein, jaroWinkler, cosine, lcs, semantic];
    const mean = scores.reduce((a, b) => a + b) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const confidence = Math.max(0.1, 1 - Math.sqrt(variance));
    
    // Determine best method
    const methodScores = { levenshtein, jaroWinkler, cosine, lcs, semantic };
    const bestMethod = Object.entries(methodScores).reduce((a, b) => methodScores[a[0]] > methodScores[b[0]] ? a : b)[0];
    
    return {
      score: Math.min(1, Math.max(0, weightedScore)),
      confidence,
      method: bestMethod,
      suggestions: this.generateSuggestions(userAnswer, correctAnswer)
    };
  }

  // Get similarity label with more nuanced categories
  public static getSimilarityLabel(score: number, confidence: number): string {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.75) return 'Correct';
    if (score >= 0.6) return 'Close';
    if (score >= 0.4) return 'Partial';
    return 'Incorrect';
  }

  // Check if answer should be considered correct
  public static isCorrect(score: number, confidence: number): boolean {
    // Higher confidence allows for slightly lower scores
    const threshold = confidence > 0.8 ? 0.7 : 0.75;
    return score >= threshold;
  }
}