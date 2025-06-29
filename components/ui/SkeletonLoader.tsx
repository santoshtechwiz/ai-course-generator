import { CardLoader, SkeletonLoader } from "@/components/ui/loader"

export function SubscriptionSkeleton() {
  return <SkeletonLoader className="space-y-8" />
}

export function LoadingCard({
  message = "Loading...",
  className,
}: {
  message?: string
  className?: string
}) {
  return <CardLoader message={message} context="loading" className={className} />
}

export { SkeletonLoader as LoadingSkeleton }
export default SubscriptionSkeleton
