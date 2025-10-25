"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  BrainCircuit,
  CreditCard as FlashcardIcon,
  CreditCard,
  GraduationCap,
  CheckCircle2,
  FileText,
  Code,
  Target,
  User,
  ListChecks,
  BookMarked,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics"
import type { DashboardUser } from "@/app/types/types"

interface SidebarNavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  badgeTooltip?: string
  description?: string
}

interface DashboardSidebarProps {
  userData?: DashboardUser | null
  userStats?: {
    coursesCount?: number
    quizzesCount?: number
    streakDays?: number
    badgesEarned?: number
  }
}

export function DashboardSidebar({ userData, userStats }: DashboardSidebarProps) {
  const pathname = usePathname()
  
  // Calculate smart metrics from user data
  const metrics = useDashboardMetrics(userData || null)

  const mainNavItems: SidebarNavItem[] = [
    {
      title: "Overview",
      href: "/dashboard/home",
      icon: LayoutDashboard,
      description: "Dashboard home"
    },
    {
      title: "My Courses",
      href: "/dashboard/courses",
      icon: BookMarked,
      badge: metrics?.courses.badgeCount ?? userStats?.coursesCount,
      badgeVariant: metrics?.courses.badgeVariant === 'primary' ? 'default' : 'secondary',
      badgeTooltip: metrics?.courses.badgeTooltip,
      description: "My enrolled courses"
    },
    {
      title: "Explore",
      href: "/dashboard/explore",
      icon: BrainCircuit,
      description: "Discover new content"
    },
  ]

  const quizNavItems: SidebarNavItem[] = [
    {
      title: "MCQ Quiz",
      href: "/dashboard/mcq",
      icon: CheckCircle2,
      description: "Multiple choice questions"
    },
    {
      title: "Flashcards",
      href: "/dashboard/flashcard",
      icon: FlashcardIcon,
      description: "Study flashcards"
    },
    {
      title: "Fill Blanks",
      href: "/dashboard/blanks",
      icon: FileText,
      description: "Fill in the blanks"
    },
    {
      title: "Open-Ended",
      href: "/dashboard/openended",
      icon: Target,
      description: "Essay questions"
    },
    {
      title: "Code Quiz",
      href: "/dashboard/code",
      icon: Code,
      description: "Coding challenges"
    },
  ]

  const accountNavItems: SidebarNavItem[] = [
    {
      title: "Subscription",
      href: "/dashboard/subscription",
      icon: CreditCard,
      description: "Plans & billing"
    },
    {
      title: "Account",
      href: "/dashboard/account",
      icon: User,
      description: "Profile settings"
    },
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard/home") {
      return pathname === href || pathname === "/dashboard"
    }
    return pathname?.startsWith(href)
  }

  return (
    <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:h-screen lg:w-64 lg:flex lg:flex-col border-r bg-card shadow-sm">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6 flex-shrink-0">
        <Link href="/dashboard/home" className="flex items-center space-x-2 group">
          <div className="h-8 w-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-[var(--color-primary)]">
            CourseAI
          </span>
        </Link>
      </div>

      {/* Navigation with Scroll */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
        {/* Main Section */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                  "hover:bg-accent hover:text-accent-foreground",
                  active 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                    : "text-muted-foreground hover:translate-x-0.5"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-md flex items-center justify-center transition-colors",
                  active ? "bg-primary/10" : "bg-muted/50 group-hover:bg-accent"
                )}>
                  <Icon className="h-4 w-4 flex-shrink-0" />
                </div>
                <span className="flex-1">{item.title}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge 
                    variant={item.badgeVariant || (active ? "default" : "secondary")} 
                    className="h-5 px-1.5 text-xs font-medium"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
            
            // Wrap with tooltip if tooltip text exists
            return item.badgeTooltip ? (
              <TooltipProvider key={item.href} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-sm">{item.badgeTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : linkContent
          })}
        </div>

        {/* Quiz Types Section */}
        <div className="space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Create Quiz
          </div>
          {quizNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                  "hover:bg-accent hover:text-accent-foreground",
                  active 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:translate-x-0.5"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.title}</span>
              </Link>
            )
          })}
        </div>

        {/* Account Section */}
        <div className="space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Account
          </div>
          {accountNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                  "hover:bg-accent hover:text-accent-foreground",
                  active 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:translate-x-0.5"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.title}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      </ScrollArea>
    </aside>
  )
}
