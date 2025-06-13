import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { 
  selectIsSubscribed, 
  selectSubscriptionStatus, 
  selectSubscriptionPlan 
} from '@/store/slices/subscription-slice';

interface SubscriptionWrapperProps {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  requiredPlan?: 'basic' | 'pro' | 'enterprise';
  showUpgradePrompt?: boolean;
}

export function SubscriptionWrapper({
  children,
  fallbackComponent,
  requiredPlan = 'basic',
  showUpgradePrompt = true,
}: SubscriptionWrapperProps) {
  // Get subscription status from Redux
  const isSubscribed = useSelector(selectIsSubscribed);
  const subscriptionStatus = useSelector(selectSubscriptionStatus);
  const currentPlan = useSelector(selectSubscriptionPlan);
  
  // Loading state
  if (subscriptionStatus === 'loading') {
    return <div className="subscription-loading">Loading access information...</div>;
  }
  
  // Check if user has required access level
  const hasPlanAccess = isSubscribed && checkPlanAccess(currentPlan, requiredPlan);
  
  // If the user has access, show the content
  if (hasPlanAccess) {
    return <>{children}</>;
  }
  
  // Otherwise, show the fallback
  return (
    <>
      {fallbackComponent || (
        showUpgradePrompt ? (
          <div className="default-upgrade-prompt">
            <h3>Premium Content</h3>
            <p>Subscribe to access this content.</p>
            <a href="/pricing" className="btn btn-primary">Upgrade Now</a>
          </div>
        ) : null
      )}
    </>
  );
}

// Helper function to check if user's plan meets required level
function checkPlanAccess(userPlan: string | undefined, requiredPlan: string): boolean {
  const planLevels = {
    'basic': 1,
    'pro': 2,
    'enterprise': 3
  };
  
  // Default user plan to lowest level if undefined
  const userLevel = userPlan ? planLevels[userPlan.toLowerCase()] || 0 : 0;
  const requiredLevel = planLevels[requiredPlan.toLowerCase()] || 1;
  
  return userLevel >= requiredLevel;
}
