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

  return <div className="w-full py-12 px-0">Payment success — verifying in background.</div>
}