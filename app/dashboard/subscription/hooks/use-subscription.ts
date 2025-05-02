import { useSelector, useDispatch } from "react-redux"
import {
  selectSubscriptionData,
  selectSubscriptionStatus,
  selectSubscriptionError,
  selectSubscriptionLoading,
  selectSubscriptionDetailsData,
  selectCanDownloadPDF,
  selectLastFetched,
  fetchSubscriptionStatus,
  fetchSubscriptionDetails,
  cancelSubscription,
  resumeSubscription,
  activateFreePlan,
  clearSubscriptionCache,
  setRefreshing,
} from "@/app/store/subscriptionSlice"
import type { AppDispatch } from "@/app/store"

export function useSubscription() {
  const dispatch = useDispatch<AppDispatch>()

  const data = useSelector(selectSubscriptionData)
  const status = useSelector(selectSubscriptionStatus)
  const error = useSelector(selectSubscriptionError)
  const isLoading = useSelector(selectSubscriptionLoading)
  const detailsData = useSelector(selectSubscriptionDetailsData)
  const canDownloadPDF = useSelector(selectCanDownloadPDF)
  const lastFetched = useSelector(selectLastFetched)

  return {
    // State
    data,
    status,
    error,
    isLoading,
    detailsData,
    isError: !!error,
    lastFetched,

    // Actions
    fetchSubscriptionStatus: (forceRefresh = false) => dispatch(fetchSubscriptionStatus(forceRefresh)),

    fetchSubscriptionDetails: (forceRefresh = false) => dispatch(fetchSubscriptionDetails(forceRefresh)),

    cancelSubscription: (reason: string) => dispatch(cancelSubscription(reason)),

    resumeSubscription: () => dispatch(resumeSubscription()),

    activateFreePlan: () => dispatch(activateFreePlan()),

    clearSubscriptionCache: () => dispatch(clearSubscriptionCache()),

    setRefreshing: (isRefreshing: boolean) => dispatch(setRefreshing(isRefreshing)),

    // Derived state
    canDownloadPDF,
  }
}
