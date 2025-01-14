import { Suspense } from 'react';
import { getAuthSession } from "@/lib/authOptions";
import { SubscriptionService } from "@/services/subscriptionService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from '@/config/subscriptionPlans';
import SubscriptionPlans from '@/app/dashboard/subscription/components/SubscriptionPlans';

export default async function SubscribePage() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  const isProd = process.env.NODE_ENV === 'production';

  async function getSubscriptionData(): Promise<{ 
    currentPlan: SubscriptionPlanType | null, 
    subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | null, 
    error?: string 
  }> {
    if (!userId) {
      return { 
        currentPlan: null, 
        subscriptionStatus: null 
      };
    }
    try {
      const { plan, status } = await SubscriptionService.getSubscriptionStatus(userId);
      return { 
        currentPlan: plan as SubscriptionPlanType, 
        subscriptionStatus: status as 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | null
      };
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      return { 
        currentPlan: null, 
        subscriptionStatus: null, 
        error: 'Failed to fetch subscription data' 
      };
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Suspense fallback={<div>Loading subscription data...</div>}>
        <SubscriptionPlansWrapper 
          userId={userId} 
          getSubscriptionData={getSubscriptionData}
          isProd={isProd}
        />
      </Suspense>
    </div>
  );
}

async function SubscriptionPlansWrapper({ 
  userId, 
  getSubscriptionData,
  isProd
}: { 
  userId: string | undefined, 
  getSubscriptionData: () => Promise<{ 
    currentPlan: SubscriptionPlanType | null, 
    subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | null
    error?: string 
  }>,
  isProd: boolean
}) {
  const { currentPlan, subscriptionStatus, error } = await getSubscriptionData();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <SubscriptionPlans 
      userId={userId} 
      currentPlan={currentPlan} 
      subscriptionStatus={subscriptionStatus}
      isProd={isProd}
    />
  );
}

