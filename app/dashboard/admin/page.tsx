import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Inbox } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  // Check if user is authenticated and is an admin
  const session = await getServerSession(authOptions)

  // If no session or user is not an admin, redirect to the homepage
  if (!session || !session.user || session.user.isAdmin !== true) {
    redirect("/")
  }

  const adminCards = [
    {
      title: "User Management",
      description: "Manage your users, view profiles, and handle subscriptions",
      icon: <Users className="h-8 w-8 text-primary" />,
      link: "/dashboard/admin/users",
    },

    {
      title: "Contact Inquiries",
      description: "View and respond to user inquiries from the contact form",
      icon: <Inbox className="h-8 w-8 text-primary" />,
      link: "/dashboard/admin/contact",
    },

    {
      title: "Email Management",
      description: "View and respond to user inquiries from the contact form",
      icon: <Inbox className="h-8 w-8 text-primary" />,
      link: "/dashboard/admin/email",
    },
  ]

  return (
    <div className="w-full px-0 py-6">
      <h1 className="text-6xl font-black uppercase tracking-wider text-black mb-4 border-b-8 border-black pb-4 text-center">
        ADMIN DASHBOARD
      </h1>

      <p className="text-xl font-bold text-gray-700 uppercase tracking-wide text-center mb-6">
        Manage Your Platform Like A Boss
      </p>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {adminCards.map((card) => (
          <Card key={card.title} className="bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-shadow hover:-translate-y-2 transform">
            <CardHeader className="bg-gradient-to-r from-blue-400 to-purple-500 p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-black uppercase text-white">{card.title}</CardTitle>
                <div className="bg-white p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {card.icon}
                </div>
              </div>
              <CardDescription className="text-white font-bold text-lg mt-4">
                {card.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-6 bg-gray-100">
              <Button asChild className="w-full bg-black text-white font-black text-xl uppercase tracking-wide py-4 hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <Link href={card.link}>MANAGE NOW</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
