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
  { name: "Explore", href: "/dashboard", icon: Compass, subItems: [], isPublic: true },
  { name: "My Learning", href: "/dashboard/dashboard", icon: BookOpen, subItems: [] },
  { name: "Quizzes", href: "/dashboard/quizzes", icon: BrainCircuit, subItems: [], isPublic: true },
  { name: "Courses", href: "/dashboard/courses", icon: BookOpen, subItems: [], isPublic: true },
  { name: "Create ", href: "/dashboard/explore", icon: PlusCircle, subItems: [] },
  { name: "Subscriptions", href: "/dashboard/subscription", icon: CreditCard, subItems: [] },
];

