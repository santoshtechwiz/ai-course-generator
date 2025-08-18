import { useMemo } from "react"
import { 
  generatePlaceholderUrl, 
  createUserPlaceholder, 
  createCoursePlaceholder, 
  createDefaultPlaceholder,
  generateInitials,
  getTextColor 
} from "@/lib/utils/placeholder"

/**
 * Hook for generating CourseAI-themed placeholders
 * Replaces broken placeholder.svg references
 */
export function usePlaceholder() {
  const placeholders = useMemo(() => ({
    /**
     * Generate a placeholder URL for any content
     */
    generate: generatePlaceholderUrl,
    
    /**
     * Create a user avatar placeholder
     */
    user: createUserPlaceholder,
    
    /**
     * Create a course thumbnail placeholder
     */
    course: createCoursePlaceholder,
    
    /**
     * Create a default placeholder
     */
    default: createDefaultPlaceholder,
    
    /**
     * Generate initials from text
     */
    initials: generateInitials,
    
    /**
     * Get consistent color for text
     */
    color: getTextColor,
    
    /**
     * Common placeholder sizes
     */
    sizes: {
      xs: 24,
      sm: 32,
      md: 48,
      lg: 64,
      xl: 96,
      "2xl": 128,
      "3xl": 192,
    }
  }), [])

  return placeholders
}

/**
 * Hook for generating a specific placeholder
 */
export function usePlaceholderUrl(
  text: string,
  size: number = 100,
  variant: "default" | "avatar" | "course" | "user" = "default"
) {
  return useMemo(() => {
    switch (variant) {
      case "user":
        return createUserPlaceholder(text, size)
      case "course":
        return createCoursePlaceholder(text, size)
      default:
        return createDefaultPlaceholder(text, size)
    }
  }, [text, size, variant])
}

/**
 * Hook for generating user avatar placeholders
 */
export function useUserAvatar(name: string, size: number = 100) {
  return useMemo(() => createUserPlaceholder(name, size), [name, size])
}

/**
 * Hook for generating course thumbnails
 */
export function useCourseThumbnail(title: string, size: number = 100) {
  return useMemo(() => createCoursePlaceholder(title, size), [title, size])
}