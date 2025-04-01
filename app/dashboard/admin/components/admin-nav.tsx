"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Settings, CreditCard, BarChart, BookOpen, Inbox } from "lucide-react"

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
      href: "/dashboard/admin/users",
      label: "Users",
      icon: <Users className="h-4 w-4 mr-2" />,
    },
  
    {
      href: "/dashboard/admin/contact",
      label: "Contact Inquiries",
      icon: <Inbox className="h-4 w-4 mr-2" />,
    },
    {
      href: "/dashboard/admin/email/campaigns",
      label: "Email",
      icon: <CreditCard className="h-4 w-4 mr-2" />,
    },
    {
      href: "/dashboard/admin/email/templates",
      label: "Email Templates",
      icon: <BookOpen className="h-4 w-4 mr-2" />,
    },
  
   
  ]

  if (!user?.isAdmin) {
    return null
  }

  return (
    <nav className="grid items-start gap-2">
      {adminLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${
            pathname === link.href ? "bg-accent text-accent-foreground" : "transparent"
          }`}
        >
          {link.icon}
          <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  )
}

