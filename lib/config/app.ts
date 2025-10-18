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
    color: "bg-[hsl(var(--category-programming))]/10 hover:bg-[hsl(var(--category-programming))]/20 border-[hsl(var(--category-programming))]/20 data-[state=checked]:border-[hsl(var(--category-programming))] data-[state=checked]:text-[hsl(var(--category-programming))]",
  },
  {
    id: "web-development",
    label: "Web Development",
    description: "Frontend and backend web development",
    icon: Terminal,
    color: "bg-[hsl(var(--category-web-development))]/10 hover:bg-[hsl(var(--category-web-development))]/20 border-[hsl(var(--category-web-development))]/20 data-[state=checked]:border-[hsl(var(--category-web-development))] data-[state=checked]:text-[hsl(var(--category-web-development))]",
  },
  {
    id: "data-science",
    label: "Data Science",
    description: "Data analysis, machine learning, and AI",
    icon: Database,
    color: "bg-[hsl(var(--category-data-science))]/10 hover:bg-[hsl(var(--category-data-science))]/20 border-[hsl(var(--category-data-science))]/20 data-[state=checked]:border-[hsl(var(--category-data-science))] data-[state=checked]:text-[hsl(var(--category-data-science))]",
  },
  {
    id: "devops",
    label: "DevOps",
    description: "Infrastructure, CI/CD, and cloud operations",
    icon: Server,
    color: "bg-[hsl(var(--category-devops))]/10 hover:bg-[hsl(var(--category-devops))]/20 border-[hsl(var(--category-devops))]/20 data-[state=checked]:border-[hsl(var(--category-devops))] data-[state=checked]:text-[hsl(var(--category-devops))]",
  },
  {
    id: "cloud-computing",
    label: "Cloud Computing",
    description: "AWS, Azure, Google Cloud platforms",
    icon: Cloud,
    color: "bg-[hsl(var(--category-cloud-computing))]/10 hover:bg-[hsl(var(--category-cloud-computing))]/20 border-[hsl(var(--category-cloud-computing))]/20 data-[state=checked]:border-[hsl(var(--category-cloud-computing))] data-[state=checked]:text-[hsl(var(--category-cloud-computing))]",
  },
  {
    id: "mobile-development",
    label: "Mobile Development",
    description: "iOS, Android, and cross-platform apps",
    icon: Camera,
    color: "bg-[hsl(var(--category-mobile-development))]/10 hover:bg-[hsl(var(--category-mobile-development))]/20 border-[hsl(var(--category-mobile-development))]/20 data-[state=checked]:border-[hsl(var(--category-mobile-development))] data-[state=checked]:text-[hsl(var(--category-mobile-development))]",
  },
  {
    id: "ui-ux-design",
    label: "UI/UX Design",
    description: "User interface and experience design",
    icon: Palette,
    color: "bg-[hsl(var(--category-ui-ux-design))]/10 hover:bg-[hsl(var(--category-ui-ux-design))]/20 border-[hsl(var(--category-ui-ux-design))]/20 data-[state=checked]:border-[hsl(var(--category-ui-ux-design))] data-[state=checked]:text-[hsl(var(--category-ui-ux-design))]",
  },
  {
    id: "digital-marketing",
    label: "Digital Marketing",
    description: "SEO, social media, and online marketing",
    icon: Megaphone,
    color: "bg-[hsl(var(--category-digital-marketing))]/10 hover:bg-[hsl(var(--category-digital-marketing))]/20 border-[hsl(var(--category-digital-marketing))]/20 data-[state=checked]:border-[hsl(var(--category-digital-marketing))] data-[state=checked]:text-[hsl(var(--category-digital-marketing))]",
  },
  {
    id: "business",
    label: "Business",
    description: "Entrepreneurship, management, and strategy",
    icon: Briefcase,
    color: "bg-[hsl(var(--category-business))]/10 hover:bg-[hsl(var(--category-business))]/20 border-[hsl(var(--category-business))]/20 data-[state=checked]:border-[hsl(var(--category-business))] data-[state=checked]:text-[hsl(var(--category-business))]",
  },
  {
    id: "health-fitness",
    label: "Health & Fitness",
    description: "Wellness, nutrition, and physical fitness",
    icon: Activity,
    color: "bg-[hsl(var(--category-health-fitness))]/10 hover:bg-[hsl(var(--category-health-fitness))]/20 border-[hsl(var(--category-health-fitness))]/20 data-[state=checked]:border-[hsl(var(--category-health-fitness))] data-[state=checked]:text-[hsl(var(--category-health-fitness))]",
  },
  {
    id: "music",
    label: "Music",
    description: "Music theory, instruments, and production",
    icon: Music,
    color: "bg-[hsl(var(--category-music))]/10 hover:bg-[hsl(var(--category-music))]/20 border-[hsl(var(--category-music))]/20 data-[state=checked]:border-[hsl(var(--category-music))] data-[state=checked]:text-[hsl(var(--category-music))]",
  },
  {
    id: "photography",
    label: "Photography",
    description: "Photography techniques and editing",
    icon: Camera,
    color: "bg-[hsl(var(--category-photography))]/10 hover:bg-[hsl(var(--category-photography))]/20 border-[hsl(var(--category-photography))]/20 data-[state=checked]:border-[hsl(var(--category-photography))] data-[state=checked]:text-[hsl(var(--category-photography))]",
  },
  {
    id: "version-control",
    label: "Version Control",
    description: "Git, GitHub, and version management",
    icon: GitBranch,
    color: "bg-[hsl(var(--category-version-control))]/10 hover:bg-[hsl(var(--category-version-control))]/20 border-[hsl(var(--category-version-control))]/20 data-[state=checked]:border-[hsl(var(--category-version-control))] data-[state=checked]:text-[hsl(var(--category-version-control))]",
  },
  {
    id: "algorithms",
    label: "Algorithms",
    description: "Data structures and algorithms",
    icon: Code,
    color: "bg-[hsl(var(--category-algorithms))]/10 hover:bg-[hsl(var(--category-algorithms))]/20 border-[hsl(var(--category-algorithms))]/20 data-[state=checked]:border-[hsl(var(--category-algorithms))] data-[state=checked]:text-[hsl(var(--category-algorithms))]",
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
