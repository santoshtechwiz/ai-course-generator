import { GlobalLoader } from "@/components/ui/loader"

export function SubscriptionSkeleton() {
  return <GlobalLoader variant="skeleton" className="space-y-8" />
}

export function LoadingCard({
  message = "Loading...",
  className,
}: {
  message?: string
  className?: string
}) {
  return <GlobalLoader text={message} className={className} />
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return <GlobalLoader variant="skeleton" className={className} />
}

export default SubscriptionSkeleton
