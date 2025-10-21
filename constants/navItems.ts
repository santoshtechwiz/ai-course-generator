import { Compass, Home, BookOpen, BrainCircuit, PlusCircle, CreditCard } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  subItems: SubItem[]
  isPublic?: boolean
}

interface SubItem {
  name: string
  href: string
}

export const navItems: NavItem[] = [
  { name: "Home", href: "/", icon: Home, subItems: [] },
  { name: "Learning", href: "/dashboard/home", icon: BookOpen, subItems: [] },
  { name: "Quizzes", href: "/dashboard/quizzes", icon: BrainCircuit, subItems: [], isPublic: true },
  { name: "Courses", href: "/dashboard", icon: Compass, subItems: [], isPublic: true },
  { name: "Create", href: "/dashboard/explore", icon: PlusCircle, subItems: [] },
  { name: "Plans", href: "/dashboard/subscription", icon: CreditCard, subItems: [] },
]
