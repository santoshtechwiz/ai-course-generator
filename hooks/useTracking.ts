import { trackClientSideInteraction } from "@/lib/tracking"
import { useCallback } from "react"


export function useTracking(userId: string) {
  const trackInteraction = useCallback(
    (interactionType: string, entityId: string, entityType: string, metadata?: any) => {
      trackClientSideInteraction(userId, interactionType, entityId, entityType, metadata)
    },
    [userId],
  )

  return { trackInteraction }
}

