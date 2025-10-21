"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import {
  ChevronRight,
  MoreHorizontal,
  Home,
  Folder,
  FileText,
  Settings,
  User,
  Calendar,
  Mail,
  Search,
  Bell,
  Bookmark,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type BreadcrumbIconType =
  | "home"
  | "folder"
  | "file"
  | "settings"
  | "user"
  | "calendar"
  | "mail"
  | "search"
  | "bell"
  | "bookmark"
  | string

interface BreadcrumbProps extends React.ComponentPropsWithoutRef<"nav"> {
  separator?: React.ReactNode
  children?: React.ReactNode
  maxItems?: number
  paths?: BreadcrumbPath[]
  showIcons?: boolean
}

interface BreadcrumbPath {
  name: string
  href: string
  icon?: BreadcrumbIconType
}

const iconMap = {
  home: Home,
  folder: Folder,
  file: FileText,
  settings: Settings,
  user: User,
  calendar: Calendar,
  mail: Mail,
  search: Search,
  bell: Bell,
  bookmark: Bookmark,
}

const getIconComponent = (iconType: BreadcrumbIconType): React.ReactNode => {
  const IconComponent = iconMap[iconType.toLowerCase() as keyof typeof iconMap]
  return IconComponent ? <IconComponent className="h-4 w-4 mr-1.5" /> : null
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, separator, children, maxItems = 0, paths, showIcons = true, ...props }, ref) => {
    const renderItems = () => {
      if (!paths) return children

      if (maxItems > 0 && paths.length > maxItems) {
        const overflowCount = paths.length - maxItems
        const firstItems = paths.slice(0, 1)
        const lastItems = paths.slice(paths.length - (maxItems - 1))

        return (
          <>
            {firstItems.map((path, index) => (
              <FragmentWithSeparator key={index} path={path} index={index} />
            ))}

            <BreadcrumbItem>
              <BreadcrumbEllipsis
                items={paths.slice(1, paths.length - (maxItems - 1)).map((path, index) => (
                  <DropdownMenuItem key={index} asChild>
                    <BreadcrumbLink href={path.href}>
                      {showIcons && path.icon && getIconComponent(path.icon)}
                      {path.name}
                    </BreadcrumbLink>
                  </DropdownMenuItem>
                ))}
              />
            </BreadcrumbItem>
            <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>

            {lastItems.map((path, index) => (
              <FragmentWithSeparator
                key={firstItems.length + overflowCount + index}
                path={path}
                index={firstItems.length + overflowCount + index}
                isLast={index === lastItems.length - 1}
              />
            ))}
          </>
        )
      }

      return paths.map((path, index) => (
        <FragmentWithSeparator key={index} path={path} index={index} isLast={index === paths.length - 1} />
      ))
    }

    const FragmentWithSeparator = ({
      path,
      index,
      isLast,
    }: {
      path: BreadcrumbPath
      index: number
      isLast?: boolean
    }) => (
      <React.Fragment key={index}>
        <BreadcrumbItem isActive={isLast} level={index}>
          <BreadcrumbLink href={path.href}>
            {showIcons && path.icon && getIconComponent(path.icon)}
            <span className="truncate max-w-[160px]">{path.name}</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {!isLast && <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>}
      </React.Fragment>
    )

    return (
      <nav
        ref={ref}
        aria-label="breadcrumb"
        className={cn("flex items-center overflow-x-auto scrollbar-hide", className)}
        {...props}
      >
        <ol className="flex items-center gap-2 text-sm whitespace-nowrap">{renderItems()}</ol>
      </nav>
    )
  },
)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, isActive, children, ...props }, ref) => (
    <li
      ref={ref}
      className={cn("inline-flex items-center gap-1.5 transition-colors", isActive && "text-foreground", className)}
      {...props}
    >
      {children}
    </li>
  ),
)
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, asChild = false, isActive, ...props }, ref) => {
    const Comp = asChild ? Slot : "a"
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center px-2.5 py-1 rounded-md text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive ? "bg-accent/50 font-medium" : "text-muted-foreground",
          className,
        )}
        {...props}
      />
    )
  },
)
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbSeparator = ({ children, className }: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("flex items-center text-muted-foreground [&>svg]:size-4", className)}
  >
    {children || <ChevronRight className="opacity-50" />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({ className, items = [], ...props }: BreadcrumbEllipsisProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        {...props}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Toggle breadcrumb menu</span>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      {items.map((item, index) => (
        <React.Fragment key={index}>{item}</React.Fragment>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
)
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

interface BreadcrumbItemProps extends React.ComponentPropsWithoutRef<"li"> {
  isActive?: boolean
  level?: number
}

interface BreadcrumbLinkProps extends React.ComponentPropsWithoutRef<"a"> {
  asChild?: boolean
  isActive?: boolean
  level?: number
}

interface BreadcrumbEllipsisProps extends React.ComponentProps<"button"> {
  items?: React.ReactNode[]
}

export { Breadcrumb,     }
