import type { ReactNode } from "react"

interface SlugPageLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  title?: string
  description?: string
  fullWidth?: boolean
  sidebarWidth?: "narrow" | "wide"
}

const SlugPageLayout=({
  children,
  sidebar,
  title,
  description,
  fullWidth = false,
  sidebarWidth = "narrow",
}: SlugPageLayoutProps)=> {
  return (
    <div className="content-container">
      {(title || description) && (
        <div className="mb-8 text-center">
          {title && <h1 className="heading-1 mb-3">{title}</h1>}
          {description && <p className="body-large text-muted-foreground max-w-3xl mx-auto">{description}</p>}
        </div>
      )}

      <div
        className={`${fullWidth ? "" : "lg:grid gap-8"} ${
          sidebar ? (sidebarWidth === "narrow" ? "lg:grid-cols-[1fr_300px]" : "lg:grid-cols-[2fr_1fr]") : ""
        }`}
      >
        <div className="space-y-6 mb-8 lg:mb-0">{children}</div>
        {sidebar && <div className="space-y-6">{sidebar}</div>}
      </div>
    </div>
  )
}

export default SlugPageLayout;