import { NavItem } from '@/app/types'
import { Cpu, Brain, Sparkles, Zap, CreditCard } from 'lucide-react'

export const navItems = [
  { 
    name: "Dashboard", 
    href: "/dashboard",
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
    href: "/dashboard/create",
    icon: Zap,
    subItems: [
      { name: "New Course", href: "/dashboard/create" ,icon:Zap },
      { name: "New MCQ Quiz", href: "/dashboard/quiz" ,icon:Zap},
      { name: "New Open Quiz", href: "/dashboard/openended",icon:Zap },
    ]
  },
  { 
    name: "Subscriptions", 
    href: "/dashboard/subscription",
    icon: CreditCard,
    subItems: []
  },
] as NavItem[]

