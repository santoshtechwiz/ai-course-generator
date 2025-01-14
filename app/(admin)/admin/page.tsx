import { Metadata } from "next"
import AdminDashboard from "../components/AdminDashboard"


export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage courses, quizzes, and users",
}

export default function AdminPage() {
  return <AdminDashboard />
}

