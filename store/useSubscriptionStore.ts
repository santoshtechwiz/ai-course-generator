"use client"

/**
 * @deprecated Use hooks/use-subscription.ts instead
 * This file is maintained for backwards compatibility
 */

import { useAppSelector, useAppDispatch } from "@/store"
import {
  fetchSubscription,
  selectSubscription,
  selectSubscriptionLoading,
  selectSubscriptionError,
} from "@/store/slices/subscription-slice"

export const useSubscription = () => {
  const dispatch = useAppDispatch()
  const subscription = useAppSelector(selectSubscription)
  const isLoading = useAppSelector(selectSubscriptionLoading)
  const error = useAppSelector(selectSubscriptionError)

  return {
    subscription,
    data: subscription,
    isLoading,
    isError: !!error,
    error,
    fetchStatus: () => dispatch(fetchSubscription()),
    fetchSubscriptionStatus: () => dispatch(fetchSubscription()),
    canDownloadPDF: () => subscription?.subscriptionPlan !== "FREE",
  }
}

export default useSubscription
