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
        className={`${fullWidth ? "" : "grid gap-8"} ${
          sidebar
            ? sidebarWidth === "narrow"
              ? "grid-cols-1 lg:grid-cols-[1fr_300px]"
              : "grid-cols-1 lg:grid-cols-[2fr_1fr]"
            : ""
        }`}
      >
        <div className="space-y-6">{children}</div>
        {sidebar && <div className="space-y-6 mt-8 lg:mt-0 sticky top-24 self-start h-fit">{sidebar}</div>}
      </div>
    </div>
  )
}

export default SlugPageLayout

