/**
 * Application Configuration
 * 
 * Centralized configuration for categories, routes, and application settings.
 * Consolidates configuration from multiple config files.
 */

import {
  Code2,
  Palette,
  Megaphone,
  BookOpen,
  Camera,
  Music,
  Activity,
  Briefcase,
  Terminal,
  Database,
  Server,
  Cloud,
  GitBranch,
  Code,
} from "lucide-react"

// ============================================================================
// CATEGORY CONFIGURATION
// ============================================================================

export const categories = [
  {
    id: "programming",
    label: "Programming",
    description: "Software development and coding",
    icon: Code2,
    color: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 data-[state=checked]:border-blue-500 data-[state=checked]:text-blue-500",
  },
  {
    id: "web-development",
    label: "Web Development",
    description: "Frontend and backend web development",
    icon: Terminal,
    color: "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 data-[state=checked]:border-cyan-500 data-[state=checked]:text-cyan-500",
  },
  {
    id: "data-science",
    label: "Data Science",
    description: "Data analysis, machine learning, and AI",
    icon: Database,
    color: "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 data-[state=checked]:border-yellow-500 data-[state=checked]:text-yellow-500",
  },
  {
    id: "devops",
    label: "DevOps",
    description: "Infrastructure, CI/CD, and cloud operations",
    icon: Server,
    color: "bg-gray-500/10 hover:bg-gray-500/20 border-gray-500/20 data-[state=checked]:border-gray-500 data-[state=checked]:text-gray-500",
  },
  {
    id: "cloud-computing",
    label: "Cloud Computing",
    description: "AWS, Azure, Google Cloud platforms",
    icon: Cloud,
    color: "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 data-[state=checked]:border-indigo-500 data-[state=checked]:text-indigo-500",
  },
  {
    id: "mobile-development",
    label: "Mobile Development",
    description: "iOS, Android, and cross-platform apps",
    icon: Camera,
    color: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20 data-[state=checked]:border-green-500 data-[state=checked]:text-green-500",
  },
  {
    id: "ui-ux-design",
    label: "UI/UX Design",
    description: "User interface and experience design",
    icon: Palette,
    color: "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20 data-[state=checked]:border-pink-500 data-[state=checked]:text-pink-500",
  },
  {
    id: "digital-marketing",
    label: "Digital Marketing",
    description: "SEO, social media, and online marketing",
    icon: Megaphone,
    color: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20 data-[state=checked]:border-orange-500 data-[state=checked]:text-orange-500",
  },
  {
    id: "business",
    label: "Business",
    description: "Entrepreneurship, management, and strategy",
    icon: Briefcase,
    color: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 data-[state=checked]:border-purple-500 data-[state=checked]:text-purple-500",
  },
  {
    id: "health-fitness",
    label: "Health & Fitness",
    description: "Wellness, nutrition, and physical fitness",
    icon: Activity,
    color: "bg-accent/10 hover:bg-accent/20 border-accent/20 data-[state=checked]:border-accent data-[state=checked]:text-accent",
  },
  {
    id: "music",
    label: "Music",
    description: "Music theory, instruments, and production",
    icon: Music,
    color: "bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20 data-[state=checked]:border-violet-500 data-[state=checked]:text-violet-500",
  },
  {
    id: "photography",
    label: "Photography",
    description: "Photography techniques and editing",
    icon: Camera,
    color: "bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20 data-[state=checked]:border-teal-500 data-[state=checked]:text-teal-500",
  },
  {
    id: "version-control",
    label: "Version Control",
    description: "Git, GitHub, and version management",
    icon: GitBranch,
    color: "bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/20 data-[state=checked]:border-slate-500 data-[state=checked]:text-slate-500",
  },
  {
    id: "algorithms",
    label: "Algorithms",
    description: "Data structures and algorithms",
    icon: Code,
    color: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 data-[state=checked]:border-emerald-500 data-[state=checked]:text-emerald-500",
  },
] as const

export type CategoryId = typeof categories[number]["id"]

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

export const routeConfig = {
  public: [
    "/",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/unauthorized",
    "/not-found",
    "/api/auth/signin",
    "/api/auth/signout",
    "/api/auth/callback",
  ],
  protected: [
    "/dashboard",
    "/dashboard/course",
    "/dashboard/create",
    "/dashboard/subscription",
    "/dashboard/profile",
    "/dashboard/settings",
  ],
  admin: [
    "/admin",
    "/admin/users",
    "/admin/courses",
    "/admin/analytics",
  ],
  redirects: {
    "/login": "/api/auth/signin",
    "/logout": "/api/auth/signout",
    "/signup": "/api/auth/signin",
  }
} as const

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

export interface NavItem {
  title: string
  href?: string
  disabled?: boolean
  external?: boolean
  icon?: any
  label?: string
  description?: string
  items?: SubItem[]
}

export interface SubItem {
  title: string
  href: string
  disabled?: boolean
  external?: boolean
  icon?: any
  label?: string
  description?: string
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Main dashboard overview"
  },
  {
    title: "Courses",
    href: "/dashboard/explore",
    description: "Browse and take courses"
  },
  {
    title: "Quizzes",
    href: "/dashboard/quizzes",
    description: "Practice with quizzes"
  },
  {
    title: "Create",
    href: "/dashboard/create",
    description: "Create new content"
  },
  {
    title: "Profile",
    href: "/dashboard/profile", 
    description: "Manage your profile"
  }
] as const

// ============================================================================
// STRIPE CONFIGURATION
// ============================================================================

export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  plans: {
    free: {
      priceId: '',
      name: 'Free',
      description: 'Basic features for personal use',
      price: 0,
      interval: 'month',
      features: ['5 courses', '10 quizzes', 'Basic support']
    },
    basic: {
      priceId: process.env.STRIPE_BASIC_PRICE_ID!,
      name: 'Basic',
      description: 'Enhanced features for regular users',
      price: 9.99,
      interval: 'month',
      features: ['25 courses', '50 quizzes', 'Email support', 'Progress tracking']
    },
    premium: {
      priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
      name: 'Premium',
      description: 'Advanced features for power users',
      price: 19.99,
      interval: 'month',
      features: ['Unlimited courses', 'Unlimited quizzes', 'Priority support', 'Advanced analytics']
    }
  }
} as const

// ============================================================================
// GITHUB OAUTH CONFIGURATION
// ============================================================================

export const githubConfig = {
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  scope: 'read:user user:email',
  allowSignup: true,
  enterprise: {
    baseURL: process.env.GITHUB_ENTERPRISE_URL,
    clientId: process.env.GITHUB_ENTERPRISE_CLIENT_ID,
    clientSecret: process.env.GITHUB_ENTERPRISE_CLIENT_SECRET,
  }
} as const

// ============================================================================
// LANGUAGE CONFIGURATION
// ============================================================================

export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
] as const

export const defaultLanguage = 'en'
