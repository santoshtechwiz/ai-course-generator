import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface CourseCardProps {
  id: string
  title: string
  description: string
  imageUrl: string
  authorName: string
  authorImageUrl?: string
  category?: string
  progress?: number
  duration?: string
  lessonsCount?: number
  href: string
  className?: string
  featured?: boolean
}

export const CourseCard = ({
  id,
  title,
  description,
  imageUrl,
  authorName,
  authorImageUrl,
  category,
  progress,
  duration,
  lessonsCount,
  href,
  className,
  featured = false,
}: CourseCardProps) => {
  return (
    <Link href={href} className="block">
      <div
        className={cn(
          "bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg",
          featured && "ring-2 ring-primary",
          className,
        )}
      >
        <div className="relative h-48 w-full">
          <Image src={imageUrl || "/placeholder.svg?height=192&width=384"} alt={title} fill className="object-cover" />
          {category && <Badge className="absolute top-3 right-3">{category}</Badge>}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">{title}</h3>

          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{description}</p>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {authorImageUrl ? (
                <Image
                  src={authorImageUrl || "/placeholder.svg"}
                  alt={authorName}
                  width={24}
                  height={24}
                  className="rounded-full mr-2"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 mr-2"></div>
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300">{authorName}</span>
            </div>

            {duration && <span className="text-xs text-gray-500 dark:text-gray-400">{duration}</span>}
          </div>

          {typeof progress === "number" && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          {lessonsCount && (
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {lessonsCount} {lessonsCount === 1 ? "lesson" : "lessons"}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

