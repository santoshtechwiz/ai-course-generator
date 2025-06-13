"use client";

// ... existing imports ...
import { useSession } from "next-auth/react";

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  // ... existing code ...

  const fetchSubscriptionData = useCallback(async () => {
    // Skip subscription fetch if not authenticated
    if (!isAuthenticated) {
      // Set a default free subscription state when not logged in
      dispatch(setSubscriptionStatus({
        isSubscribed: false,
        plan: 'free',
        features: {
          basic: true,
          advanced: false,
          premium: false
        }
      }));
      return;
    }

    try {
      // Only fetch when authenticated
      dispatch(fetchSubscription());
    } catch (error) {
      console.warn("Error fetching subscription:", error);
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    // Only try to fetch subscription data when auth state is known
    if (status !== "loading") {
      // Small delay to ensure auth is fully established
      setTimeout(() => {
        fetchSubscriptionData();
      }, 100); 
    }
  }, [fetchSubscriptionData, status]);

  // ... rest of component ...
};
