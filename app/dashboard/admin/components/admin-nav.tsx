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
    <div className="space-y-4 bg-pink-100 p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="pb-2">
        <Link href="/" className="flex items-center gap-3 text-2xl font-black uppercase tracking-wider hover:text-pink-600 transition-colors">
          <Home className="h-8 w-8" />
          <span>ADMIN PORTAL</span>
        </Link>
      </div>

      <nav className="grid items-start gap-4">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`group flex items-center gap-3 rounded-none px-6 py-4 text-lg font-bold uppercase tracking-wide transition-all hover:bg-black hover:text-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              pathname === link.href 
                ? "bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
                : "bg-white text-black hover:-translate-y-1"
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
