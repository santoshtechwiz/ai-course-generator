
import { Cpu, Brain, Sparkles, Zap, CreditCard } from 'lucide-react'

export const navItems = [
  { 
    name: "Explore", 
    href: "/dashboard",
    icon: Sparkles,
    subItems: []
  },
  { 
    name: "Dashboard", 
    href: "/dashboard/dashboard",
    icon: Cpu,
    subItems: []
  },
  { 
    name: "Courses", 
    href: "/dashboard/courses",
    icon: Brain,
    subItems: []
  },
  { 
    name: "Quizzes", 
    href: "/dashboard/quizzes",
    icon: Sparkles,
    subItems: []
  },
  { 
    name: "Create", 
    href: "/dashboard/explore",
    icon: Zap,
    subItems: [
     
    ]
  },
  { 
    name: "Subscriptions", 
    href: "/dashboard/subscription",
    icon: CreditCard,
    subItems: []
  },
] as NavItem[]

interface NavItem {
  name: string
  href: string
  icon: any
  subItems: SubItem[]
}
interface SubItem {

}