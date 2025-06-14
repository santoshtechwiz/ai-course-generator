import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"

export default function UserProfile() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState(null)
  
  useEffect(() => {
    // Only fetch user profile if authenticated
    if (status === "authenticated" && session?.user) {
      apiClient.get("/api/profile")
        .then((data) => {
          if (data) {
            setProfile(data)
          }
        })
        .catch((error) => {
          console.error("Error fetching profile:", error)
        })
    }
  }, [status, session])
  
  // Show a placeholder or nothing when not authenticated
  if (status !== "authenticated" || !session?.user) {
    return (
      <div className="p-4">
        <p>Please sign in to view your profile</p>
      </div>
    )
  }
  
  // ...existing code to render the profile...
}
