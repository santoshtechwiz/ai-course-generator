import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  className?: string
  titleClassName?: string
  subtitleClassName?: string
  centered?: boolean
}

export const SectionHeader = ({
  title,
  subtitle,
  className,
  titleClassName,
  subtitleClassName,
  centered = false,
}: SectionHeaderProps) => {
  return (
    <div className={cn("mb-6", centered && "text-center", className)}>
      <h2 className={cn("text-2xl font-bold text-gray-900 dark:text-white", titleClassName)}>{title}</h2>
      {subtitle && <p className={cn("mt-2 text-gray-600 dark:text-gray-300", subtitleClassName)}>{subtitle}</p>}
    </div>
  )
}

