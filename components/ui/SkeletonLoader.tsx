import { ClipLoader } from "react-spinners"

export function SubscriptionSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      <ClipLoader color="#3B82F6" size={40} />
      <p className="text-sm text-muted-foreground">Loading subscription...</p>
    </div>
  )
}

export function LoadingCard({
  message = "Loading...",
  className = "",
}: {
  message?: string
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 space-y-4 ${className}`}>
      <ClipLoader color="#3B82F6" size={32} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 space-y-4 ${className}`}>
      <ClipLoader color="#3B82F6" size={40} />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  )
}

export default SubscriptionSkeleton
