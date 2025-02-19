import { Compass, Home, BookOpen, BrainCircuit, PlusCircle, CreditCard } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  subItems: SubItem[]
  isPublic?: boolean
}

export interface SubItem {
  name: string
  href: string
}

export const navItems: NavItem[] = [
  { name: "Home", href: "/", icon: Home, subItems: [] },
  { name: "Learning Path", href: "/dashboard/dashboard", icon: BookOpen, subItems: [] },
  { name: "Quizzes", href: "/dashboard/quizzes", icon: BrainCircuit, subItems: [], isPublic: true },
  { name: "Courses", href: "/dashboard", icon: Compass, subItems: [], isPublic: true },
  { name: "Create", href: "/dashboard/explore", icon: PlusCircle, subItems: [] },
  { name: "Membership", href: "/dashboard/subscription", icon: CreditCard, subItems: [] },
]

