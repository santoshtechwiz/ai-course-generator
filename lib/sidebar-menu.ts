import { LayoutDashboard, BookOpen, PlusCircle, HelpCircle, Code, User, Settings } from 'lucide-react'

export const menuItems = [
  { href: "/dashboard/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "My Courses", icon: BookOpen },
  { href: "/dashboard/create", label: "Create Course", icon: PlusCircle, requiresAuth: true },
  { href: "/dashboard/quiz", label: "Create Quiz", icon: HelpCircle, requiresAuth: true },
  { href: "/dashboard/code", label: "Code", icon: Code },
  { href: "/dashboard/profile", label: "Profile", icon: User, requiresAuth: true },
  { href: "/admin", label: "Admin", icon: Settings, requiresAuth: true },
] as const
