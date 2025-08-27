"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  BookOpen,
  Home,
  Search,
  Filter,
  Menu,
  X,
  TrendingUp,
  Clock,
  Star,
  Users,
  PlayCircle,
  FileQuestion,
  Code,
  PenTool,
  Lightbulb,
  Target,
  Award,
  Settings,
  User,
  CreditCard,
  HelpCircle,
  LogOut
} from "lucide-react"
import { categories } from "@/config/categories"
import { navItems } from "@/constants/navItems"

interface UdemyDashboardLayoutProps {
  children: React.ReactNode
}

// Dashboard configuration
const dashboardConfig = {
  title: "CourseAI Dashboard",
  subtitle: "Welcome back! Continue your learning journey",
  navigationTitle: "Navigation",
  learningPathsTitle: "Learning Paths",
  popularTagsTitle: "Popular Tags",
  accountTitle: "Account & Settings",
  viewAllTagsText: "View All Tags",
  clearFiltersText: "Clear",
  activeFiltersText: (count: number) => `${count} filter${count > 1 ? 's' : ''} active`
}

// Transform navItems to match our navigation structure
const navigationItems = navItems
  .filter(item => item.href !== "/") // Remove home page link
  .map(item => ({
    title: item.name,
    href: item.href,
    icon: item.icon,
    description: item.name === "Learning" ? "Continue Learning" :
                 item.name === "Quizzes" ? "Test Your Knowledge" :
                 item.name === "Courses" ? "Browse Courses" :
                 item.name === "Create" ? "Create Content" :
                 item.name === "Plans" ? "Manage Subscription" : ""
  }))

// Transform categories to learning paths
const learningPaths = categories.map(category => ({
  name: category.label,
  count: Math.floor(Math.random() * 30) + 5, // Placeholder count
  color: category.color.includes("blue") ? "bg-blue-500" :
         category.color.includes("cyan") ? "bg-cyan-500" :
         category.color.includes("yellow") ? "bg-yellow-500" :
         category.color.includes("gray") ? "bg-gray-500" :
         category.color.includes("sky") ? "bg-sky-500" :
         category.color.includes("orange") ? "bg-orange-500" :
         category.color.includes("violet") ? "bg-violet-500" :
         category.color.includes("purple") ? "bg-purple-500" :
         category.color.includes("amber") ? "bg-amber-500" :
         category.color.includes("green") ? "bg-green-500" :
         category.color.includes("accent") ? "bg-accent" :
         category.color.includes("indigo") ? "bg-indigo-500" :
         category.color.includes("pink") ? "bg-pink-500" :
         category.color.includes("teal") ? "bg-teal-500" : "bg-gray-500"
}))

// Generate popular tags from categories
const popularTags = categories.flatMap(category => {
  const baseTags = [category.label.toLowerCase().replace(/\s+/g, '')]
  // Add some related tags based on category
  switch (category.id) {
    case 'programming':
      return [...baseTags, 'javascript', 'python', 'java', 'cpp']
    case 'web-development':
      return [...baseTags, 'react', 'vue', 'angular', 'html', 'css']
    case 'data-science':
      return [...baseTags, 'machine-learning', 'ai', 'pandas', 'numpy']
    case 'devops':
      return [...baseTags, 'docker', 'kubernetes', 'aws', 'ci-cd']
    case 'cloud-computing':
      return [...baseTags, 'aws', 'azure', 'gcp', 'terraform']
    case 'version-control':
      return [...baseTags, 'git', 'github', 'gitlab']
    case 'software-architecture':
      return [...baseTags, 'design-patterns', 'microservices', 'scalability']
    case 'design':
      return [...baseTags, 'ui-ux', 'figma', 'adobe', 'photoshop']
    case 'business':
      return [...baseTags, 'entrepreneurship', 'management', 'strategy']
    case 'marketing':
      return [...baseTags, 'digital-marketing', 'seo', 'social-media']
    case 'education':
      return [...baseTags, 'teaching', 'e-learning', 'pedagogy']
    case 'photography':
      return [...baseTags, 'digital-photography', 'lightroom', 'editing']
    case 'music':
      return [...baseTags, 'music-production', 'theory', 'composition']
    case 'health':
      return [...baseTags, 'fitness', 'nutrition', 'wellness']
    default:
      return baseTags
  }
}).slice(0, 20) // Limit to 20 tags

export function UdemyDashboardLayout({ children }: UdemyDashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const pathname = usePathname()

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">{dashboardConfig.navigationTitle}</h2>
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      <Separator />

      {/* Learning Paths */}
      <div className="p-6 flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Target className="h-4 w-4" />
          {dashboardConfig.learningPathsTitle}
        </h3>
        <div className="space-y-3">
          {learningPaths.map((path) => (
            <div key={path.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", path.color)} />
                <span className="text-sm">{path.name}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {path.count}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Popular Tags */}
      <div className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          {dashboardConfig.popularTagsTitle}
        </h3>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {popularTags.slice(0, 12).map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
        {popularTags.length > 12 && (
          <Button variant="ghost" size="sm" className="w-full mt-3 text-xs">
            {dashboardConfig.viewAllTagsText}
          </Button>
        )}
      </div>

      <Separator />

      {/* Account & Settings */}
      <div className="p-6">
        <div className="space-y-2">
          <Link href="/dashboard/account" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
            <User className="h-4 w-4" />
            {dashboardConfig.accountTitle}
          </Link>
          <Link href="/dashboard/subscription" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
            <CreditCard className="h-4 w-4" />
            Subscription
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <Link href="/help" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
            <HelpCircle className="h-4 w-4" />
            Help & Support
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-80 flex-col border-r bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Header */}
        <header className="flex items-center justify-between p-4 border-b bg-card flex-shrink-0">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>

            <div>
              <h1 className="text-xl font-semibold">{dashboardConfig.title}</h1>
              <p className="text-sm text-muted-foreground">
                {dashboardConfig.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedTags.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {dashboardConfig.activeFiltersText(selectedTags.length)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                  className="text-xs"
                >
                  {dashboardConfig.clearFiltersText}
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}