/**
 * CourseAI Placeholder Utilities
 * Replaces broken placeholder.svg references with CourseAI-themed placeholders
 */

export interface PlaceholderOptions {
  text?: string
  width?: number
  height?: number
  variant?: "default" | "avatar" | "course" | "user"
  bgColor?: string
  textColor?: string
}

/**
 * Generate a CourseAI-themed placeholder URL
 * This replaces the broken placeholder.svg references
 */
export function generatePlaceholderUrl(options: PlaceholderOptions = {}): string {
  const {
    text = "CA",
    width = 100,
    height = 100,
    variant = "default",
    bgColor,
    textColor = "ffffff"
  } = options

  // Generate consistent background color based on text if not provided
  let bg = bgColor
  if (!bg) {
    const colors = [
      "4f46e5", // indigo
      "7c3aed", // purple
      "059669", // emerald
      "dc2626", // red
      "ea580c", // orange
      "16a34a", // green
      "0891b2", // cyan
      "db2777", // pink
    ]
    
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash)
    }
    bg = colors[Math.abs(hash) % colors.length]
  }

  // Create a data URL for a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#${bg}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.3}" 
            fill="#${textColor}" text-anchor="middle" dy="0.35em" font-weight="bold">
        ${text.slice(0, 2).toUpperCase()}
      </text>
    </svg>
  `.replace(/\s+/g, ' ').trim()

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Generate initials from text for avatar placeholders
 */
export function generateInitials(text: string): string {
  if (!text) return "CA"
  
  return text
    .split(" ")
    .map(word => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Get a consistent color for a given text
 */
export function getTextColor(text: string): string {
  const colors = [
    "4f46e5", // indigo
    "7c3aed", // purple
    "059669", // emerald
    "dc2626", // red
    "ea580c", // orange
    "16a34a", // green
    "0891b2", // cyan
    "db2777", // pink
  ]
  
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Create a placeholder for user avatars
 */
export function createUserPlaceholder(name: string, size: number = 100): string {
  return generatePlaceholderUrl({
    text: generateInitials(name),
    width: size,
    height: size,
    variant: "user",
    bgColor: getTextColor(name)
  })
}

/**
 * Create a placeholder for course thumbnails
 */
export function createCoursePlaceholder(title: string, size: number = 100): string {
  return generatePlaceholderUrl({
    text: generateInitials(title),
    width: size,
    height: size,
    variant: "course",
    bgColor: getTextColor(title)
  })
}

/**
 * Create a placeholder for general content
 */
export function createDefaultPlaceholder(text: string = "CA", size: number = 100): string {
  return generatePlaceholderUrl({
    text,
    width: size,
    height: size,
    variant: "default",
    bgColor: getTextColor(text)
  })
}