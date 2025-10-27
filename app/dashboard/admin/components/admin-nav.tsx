"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart, Mail, Settings, Home, Bot } from "lucide-react"

interface AdminNavProps {
  user: {
    isAdmin?: boolean
  }
}

export default function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname()

  const adminLinks = [
    {
      href: "/dashboard/admin",
      label: "Overview",
      icon: <BarChart className="h-4 w-4 mr-2" />,
    },
    {
      href: "/dashboard/admin/ai-debug",
      label: "AI Debug",
      icon: <Bot className="h-4 w-4 mr-2" />,
    },
    {
      href: "/dashboard/admin/email",
      label: "Email",
      icon: <Mail className="h-4 w-4 mr-2" />,
    },
    {
      href: "/dashboard/admin/settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4 mr-2" />,
    },
  ]

  if (!user?.isAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex h-12 items-center border-b px-2">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Home className="h-5 w-5" />
          <span className="">Admin Portal</span>
        </Link>
      </div>

      <nav className="grid items-start gap-2">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`group flex items-center rounded-none px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors ${
              pathname === link.href ? "bg-accent text-accent-foreground" : "transparent"
            }`}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
