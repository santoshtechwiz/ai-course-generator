"use client";

import { useCallback } from 'react';
import { useToast } from '@/hooks';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';
import { useAuth } from '@/modules/auth';
import { PROTECTED_ACTIONS } from '@/config/subscription-routes';

export interface UseProtectedActionOptions {
  requireSubscription?: boolean;
  requireCredits?: boolean;
  validateFirst?: boolean;
}

export function useProtectedAction() {
  const { hasActiveSubscription, hasCredits } = useUnifiedSubscription();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const executeProtectedAction = useCallback(async <T,>(
    action: () => Promise<T>,
    actionType: keyof typeof PROTECTED_ACTIONS,
    options: UseProtectedActionOptions = {}
  ): Promise<T | null> => {
    const { 
      requireSubscription = true, 
      requireCredits = true,
      validateFirst = true 
    } = options;

    try {
      if (requireSubscription && !hasActiveSubscription) {
        toast({
          title: "Subscription Required",
          description: "Please upgrade your subscription to access this feature.",
          variant: "destructive"
        });
        return null;
      }

      if (requireCredits && !hasCredits) {
        toast({
          title: "Insufficient Credits",
          description: "You don't have enough credits for this action.",
          variant: "destructive"
        });
        return null;
      }

      // Validate subscription if needed
      if (validateFirst && !isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to perform this action.",
          variant: "destructive"
        });
        return null;
      }

      return await action();
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.message || "An error occurred while performing this action.",
        variant: "destructive"
      });
      return null;
    }
  }, [hasActiveSubscription, hasCredits, isAuthenticated, toast]);

  return {
    executeProtectedAction,
    hasActiveSubscription,
    hasCredits
  };
}

export function useSubscriptionGuard() {
  const { hasActiveSubscription, hasCredits } = useUnifiedSubscription();
  const { toast } = useToast();

  const checkAccess = useCallback((
    actionType: keyof typeof PROTECTED_ACTIONS,
    options: UseProtectedActionOptions = {}
  ): boolean => {
    const { requireSubscription = true, requireCredits = true } = options;

    if (requireSubscription && !hasActiveSubscription) {
      toast({
        title: "Subscription Required",
        description: "Please upgrade your subscription to access this feature.",
        variant: "destructive"
      });
      return false;
    }

    if (requireCredits && !hasCredits) {
      toast({
        title: "Insufficient Credits",
        description: "You don't have enough credits for this action.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  }, [hasActiveSubscription, hasCredits, toast]);

  return {
    checkAccess,
    hasActiveSubscription,
    hasCredits
  };
}
