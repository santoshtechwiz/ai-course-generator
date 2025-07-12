import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import VideoProcessingDebugger from "@/components/debug/VideoProcessingDebugger"

export default async function VideoDebugPage() {
  const session = await getAuthSession()
  
  // Only allow authenticated users access
  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto py-8">
      <VideoProcessingDebugger />
    </div>
  )
}
