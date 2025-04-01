import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Inbox } from "lucide-react"

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
  ]

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {adminCards.map((card) => (
          <Card key={card.title} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{card.title}</CardTitle>
                {card.icon}
              </div>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto pt-4">
              <Button asChild className="w-full">
                <Link href={card.link}>Manage</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

