import Image from "next/image"
import { optimizeImageAlt } from "@/lib/seo-utils"

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
  keywords?: string[]
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = "",
  keywords = [],
}: OptimizedImageProps) {
  // Optimize alt text for SEO
  const optimizedAlt = optimizeImageAlt(alt, keywords)

  return (
    <Image
      src={src || "/placeholder.svg"}
      alt={optimizedAlt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      loading={priority ? "eager" : "lazy"}
    />
  )
}
