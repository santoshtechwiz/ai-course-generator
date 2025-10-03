import { redirect } from "next/navigation"

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const sessionId = searchParams?.session_id
  if (!sessionId) {
    redirect("/dashboard/subscription")
  }

  return <div className="container mx-auto py-12 px-4">Payment success — verifying in background.</div>
}