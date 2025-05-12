"use client"

import { useMemo } from "react"

// Calculate similarity between two strings
export function calculateSimilarity(str1: string, str2: string): number {
  const normalize = (str: string) => str.replace(/\s+/g, " ").trim()?.toLowerCase()
  const normalizedStr1 = normalize(str1)
  const normalizedStr2 = normalize(str2)

  if (normalizedStr1 === normalizedStr2) return 100

  const longer = normalizedStr1.length > normalizedStr2.length ? normalizedStr1 : normalizedStr2
  const shorter = normalizedStr1.length > normalizedStr2.length ? normalizedStr2 : normalizedStr1
  const longerLength = longer.length

  if (longerLength === 0) return 100

  // Function to calculate Levenshtein distance
  function levenshteinDistance(s1: string, s2: string): number {
    const matrix: number[][] = []

    // Initialize matrix
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j
    }

    // Calculate Levenshtein distance
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2[i - 1] === s1[j - 1]) {
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

    return matrix[s2.length][s1.length]
  }

  const editDistance = levenshteinDistance(longer, shorter)
  return Math.round(Math.max(0, Math.min(100, (1 - editDistance / longerLength) * 100)))
}

/**
 * Hook to calculate similarity between two strings
 * @param str1 First string to compare
 * @param str2 Second string to compare
 * @returns Similarity percentage (0-100)
 */
export function useSimilarity(str1: string, str2: string): number {
  return useMemo(() => calculateSimilarity(str1, str2), [str1, str2])
}
