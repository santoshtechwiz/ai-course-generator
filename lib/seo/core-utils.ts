/**
 * Core SEO Utilities
 * Essential functions for SEO optimization - streamlined and efficient
 */

import type { Metadata } from "next"
import { BASE_URL, SEO_CONFIG } from "./constants"

// ============================================================================
// KEYWORD EXTRACTION (Optimized)
// ============================================================================

// Compact stopwords list - only essential words
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "is", "are", "was", "were", "be", "been", "being",
  "in", "on", "at", "to", "for", "with", "by", "about", "of", "that", "this", "these", "those",
  "it", "its", "they", "them", "their", "there", "where", "when", "why", "how", "what", "which",
  "who", "will", "would", "could", "should", "may", "might", "can", "must", "have", "has", "had",
  "do", "does", "did", "get", "got", "go", "goes", "went", "come", "came", "see", "saw", "know",
  "think", "say", "said", "tell", "give", "take", "make", "use", "find", "work", "call", "try",
  "need", "feel", "become", "keep", "let", "begin", "help", "show", "play", "move", "live"
]);

/**
 * Extract SEO-friendly keywords from content
 */
export function extractKeywords(content: string, limit = 10): string[] {
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(word => 
      word.length > 2 && 
      word.length < 20 && 
      !STOPWORDS.has(word) && 
      isNaN(Number(word)) && 
      /^[a-zA-Z]/.test(word)
    );

  // Count word frequency
  const wordFreq: Record<string, number> = {};
  words.forEach((word, index) => {
    const weight = index < words.length * 0.1 ? 2 : 1; // Early words get more weight
    wordFreq[word] = (wordFreq[word] || 0) + weight;
  });

  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(entry => entry[0]);
}

// ============================================================================
// META DESCRIPTION GENERATION
// ============================================================================

/**
 * Generate optimized meta description with smart truncation
 */
export function generateMetaDescription(content: string, maxLength = 160): string {
  if (!content) return "";

  const cleanContent = content
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.,!?;:-]/g, "")
    .trim();

  if (cleanContent.length <= maxLength) return cleanContent;

  // Smart truncation at sentence boundaries
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let description = "";

  for (const sentence of sentences) {
    const potential = description + (description ? ". " : "") + sentence.trim();
    if (potential.length <= maxLength - 3) {
      description = potential;
    } else {
      break;
    }
  }

  // Fallback to word boundary
  if (!description) {
    const lastSpace = cleanContent.lastIndexOf(" ", maxLength - 3);
    description = cleanContent.substring(0, lastSpace > maxLength * 0.5 ? lastSpace : maxLength - 3);
  }

  return description + (description.length < cleanContent.length ? "..." : "");
}

// ============================================================================
// IMAGE OPTIMIZATION
// ============================================================================

/**
 * Optimize image alt text for SEO and accessibility
 */
export function optimizeImageAlt(alt: string | undefined | null, fallback: string): string {
  if (!alt) return fallback;

  return alt
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(image|picture|photo|screenshot|graphic|illustration) of /i, "")
    .replace(/^(showing|displaying|depicting|featuring) /i, "")
    .replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, "")
    .substring(0, 125)
    .trim();
}

// ============================================================================
// SOCIAL IMAGE URLS
// ============================================================================

/**
 * Generate social media image URLs
 */
export function getSocialImageUrl(
  title: string,
  description?: string,
  imagePath?: string,
  width = 1200,
  height = 630,
): string {
  if (imagePath?.startsWith("http")) return imagePath;
  if (imagePath) {
    return `${BASE_URL}${imagePath.startsWith("/") ? imagePath : "/" + imagePath}`;
  }

  const params = new URLSearchParams({
    title: title.substring(0, 100),
    width: width.toString(),
    height: height.toString(),
  });

  if (description) {
    params.set("description", description.substring(0, 200));
  }

  return `${BASE_URL}/api/og?${params.toString()}`;
}

// ============================================================================
// CONTENT TYPE HELPERS
// ============================================================================

/**
 * Get human-readable quiz type labels
 */
export function getQuizTypeLabel(quizType?: string): string {
  const typeMap: Record<string, string> = {
    mcq: "Multiple Choice",
    "multiple-choice": "Multiple Choice",
    open: "Open-Ended",
    "open-ended": "Open-Ended",
    "fill-in-blank": "Fill-in-the-Blank",
    fillinblank: "Fill-in-the-Blank",
    coding: "Coding Challenge",
    "true-false": "True/False",
    matching: "Matching",
    ordering: "Ordering",
    "drag-drop": "Drag & Drop",
  };

  return typeMap[quizType?.toLowerCase() || ""] || quizType || "Practice Quiz";
}

/**
 * Get human-readable course difficulty labels
 */
export function getCourseDifficultyLabel(difficulty?: string): string {
  const difficultyMap: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate", 
    advanced: "Advanced",
    expert: "Expert",
    "all-levels": "All Levels",
  };

  return difficultyMap[difficulty?.toLowerCase() || ""] || difficulty || "All Levels";
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate metadata for SEO issues
 */
export function validateMetadata(metadata: Metadata): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Title validation
  if (!metadata.title) {
    errors.push("Title is required");
  } else {
    const titleLength = typeof metadata.title === "string" 
      ? metadata.title.length 
      : (typeof metadata.title === "object" && "template" in metadata.title ? metadata.title.template?.length || 0 : 0);

    if (titleLength > SEO_CONFIG.titleLimit) {
      warnings.push(`Title is ${titleLength} characters, recommended max is ${SEO_CONFIG.titleLimit}`);
    }
    if (titleLength < 10) {
      warnings.push("Title is too short, recommended minimum is 10 characters");
    }
  }

  // Description validation
  if (!metadata.description) {
    errors.push("Description is required");
  } else {
    if (metadata.description.length > SEO_CONFIG.descriptionLimit) {
      warnings.push(`Description is ${metadata.description.length} characters, recommended max is ${SEO_CONFIG.descriptionLimit}`);
    }
    if (metadata.description.length < 50) {
      warnings.push("Description is too short, recommended minimum is 50 characters");
    }
  }

  // OpenGraph validation
  if (!metadata.openGraph?.images) {
    warnings.push("OpenGraph image is recommended for better social sharing");
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}
