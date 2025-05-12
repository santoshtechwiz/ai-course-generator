import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import ContactManagement from "./contact-management"

export default async function AdminContactPage() {
  // Check if user is authenticated and is an admin
  const session = await getServerSession(authOptions)

  // If no session or user is not an admin, redirect to the homepage
  if (!session || !session.user || session.user.isAdmin !== true) {
    redirect("/")
  }

  return <ContactManagement />
}
