import { useSession } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import useSubscription from "@/hooks/use-subscription";
import { useMemo } from "react";

// Define TypeScript interfaces for better type safety
interface User {
  credits?: number;
}

interface Subscription {
  planId?: string;
  credits?: number;
  subscriptionPlan?: string;
}

interface QuizPlanResult {
  isLoggedIn: boolean;
  credits: number;
  maxQuestions: number;
  isLoading: boolean;
  currentPlan: string;
  error: Error | null;
}

export function useQuizPlan(requiredCredits: number = 1): QuizPlanResult {
  const { data: session, status: sessionStatus } = useSession();
  const { user } = useAuth();
  const { 
    data: subscriptionData, 
    isLoading: isLoadingSubscription,
    error: subscriptionError 
  } = useSubscription() as { 
    data?: Subscription; 
    isLoading: boolean;
    error: Error | null;
  };

  return useMemo(() => {
    // Determine user's login status
    const isLoggedIn = sessionStatus === "authenticated" || !!user;
    
    // Get actual user credits from user object - use safer type checking
    const userCredits = user && typeof user === 'object' && 'credits' in user ? 
      Number(user.credits) : undefined;
      
    // Get subscription credits with type safety
    const subCredits = subscriptionData?.credits ? Number(subscriptionData.credits) : undefined;
    
    // Use user credits first, then fall back to subscription credits, then default to 0
    const credits = !isNaN(Number(userCredits)) ? Number(userCredits) : 
                   !isNaN(Number(subCredits)) ? Number(subCredits) : 0;
    
    // Determine max questions based on subscription with proper type checking
    const maxQuestions = subscriptionData?.planId === "premium" ? 30 : 
      subscriptionData?.planId === "basic" ? 15 : 10;
      
    // Get current plan name for display purposes
    const currentPlan = subscriptionData?.subscriptionPlan || 
      subscriptionData?.planId || 
      "free";
      
    return {
      isLoggedIn,
      credits,
      maxQuestions,
      isLoading: isLoadingSubscription && sessionStatus === "loading",
      currentPlan,
      error: subscriptionError
    };
  }, [user, sessionStatus, subscriptionData, isLoadingSubscription, subscriptionError]);
}
