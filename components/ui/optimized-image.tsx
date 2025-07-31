import { optimizeImageAlt } from "@/lib/seo"
import Image from "next/image"


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
}: OptimizedImageProps) {  // Optimize alt text for SEO
  const keywordString = keywords.length > 0 ? keywords.join(' ') : alt
  const optimizedAlt = optimizeImageAlt(alt, keywordString)

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
