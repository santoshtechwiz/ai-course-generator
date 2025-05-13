"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Settings,
  Users,
  PlusCircle,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { DashboardUser } from "@/app/types/types"

interface DashboardSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  userData: DashboardUser
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export default function DashboardSidebar({
  activeTab,
  setActiveTab,
  userData,
  isOpen,
  setIsOpen,
}: DashboardSidebarProps) {
  const isAdmin = userData.isAdmin

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Overview",
      value: "overview",
    },
    {
      icon: BookOpen,
      label: "My Courses",
      value: "courses",
      count: userData.courses.length,
    },
    {
      icon: GraduationCap,
      label: "My Quizzes",
      value: "quizzes",
      count: userData.userQuizzes?.length || 0, // Added null check for userQuizzes
    },
    {
      icon: BarChart3,
      label: "Statistics",
      value: "stats",
    },
  ]

  const adminItems = [
    {
      icon: Users,
      label: "User Management",
      href: "/admin/users",
    },
  ]

  return (
    <div
      className={`border-r bg-background h-screen flex flex-col transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      } ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} fixed md:relative z-40`}
    >
      <div className="flex items-center h-14 px-4 border-b">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          {isOpen && <span className="font-bold text-lg">EduDash</span>}
        </div>
        <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setIsOpen(!isOpen)}>
          <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "" : "rotate-180"}`} />
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => (
            <Button
              key={item.value}
              variant={activeTab === item.value ? "secondary" : "ghost"}
              className={`w-full justify-start ${isOpen ? "" : "justify-center"} mb-1`}
              onClick={() => setActiveTab(item.value)}
            >
              <item.icon className="h-5 w-5 mr-2" />
              {isOpen && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.count !== undefined && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.count}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          ))}
        </nav>

        {isOpen && (
          <>
            <div className="px-4 py-2 mt-6">
              <h3 className="text-xs uppercase text-muted-foreground font-medium tracking-wider mb-2">Create New</h3>
              <div className="space-y-1">
                <Button variant="outline" className="w-full justify-start text-sm" asChild>
                  <Link href="/dashboard/course">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span className="flex-1 text-left">New Course</span>
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" asChild>
                  <Link href="/dashboard/explore">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Quiz
                  </Link>
                </Button>
              </div>
            </div>

            {isAdmin && (
              <div className="px-4 py-2">
                <h3 className="text-xs uppercase text-muted-foreground font-medium tracking-wider mb-2">Admin</h3>
                <div className="space-y-1">
                  {adminItems.map((item) => (
                    <Button key={item.href} variant="outline" className="w-full justify-start text-sm" asChild>
                      <Link href={item.href}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t p-4">
        <Button variant="outline" className={`w-full ${isOpen ? "justify-between" : "justify-center"}`} asChild>
          <Link href="/dashboard/settings">
            {isOpen ? (
              <>
                <div className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <Settings className="h-4 w-4" />
            )}
          </Link>
        </Button>
      </div>
    </div>
  )
}
