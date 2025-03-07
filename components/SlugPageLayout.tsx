import type { ReactNode } from "react"

interface SlugPageLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  title?: string
  description?: string
  fullWidth?: boolean
  sidebarWidth?: "narrow" | "wide"
}

const SlugPageLayout = ({
  children,
  sidebar,
  title,
  description,
  fullWidth = false,
  sidebarWidth = "narrow",
}: SlugPageLayoutProps) => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {(title || description) && (
        <div className="mb-8 text-center">
          {title && <h1 className="text-3xl font-bold mb-3">{title}</h1>}
          {description && <p className="text-lg text-muted-foreground max-w-3xl mx-auto">{description}</p>}
        </div>
      )}

      <div
        className={`grid ${fullWidth ? "" : "lg:gap-12 items-start"} ${
          sidebar
            ? sidebarWidth === "narrow"
              ? "grid-cols-1 lg:grid-cols-[1fr_300px]"
              : "grid-cols-1 lg:grid-cols-[2fr_1fr]"
            : ""
        }`}
      >
        <div className="">{children}</div>
        {sidebar && <div className="space-y-6 sticky top-24 h-fit">{sidebar}</div>}
      </div>
    </div>
  )
}

export default SlugPageLayout
