
import { Suspense } from 'react';
import { getAuthSession } from "@/lib/authOptions";
import { SubscriptionService } from "@/services/subscriptionService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SubscriptionPlanType } from '@/config/subscriptionPlans';
import SubscriptionPlans from '@/app/dashboard/subscription/components/SubscriptionPlans';
import { Skeleton } from "@/components/ui/skeleton";

const Page=async ()=>{
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

  const subscriptionData = await getSubscriptionData();

  return (
    <div className="container mx-auto px-4 py-8">
     
      <Suspense fallback={<SubscriptionPlansSkeleton />}>
        <SubscriptionPlansWrapper 
          userId={userId} 
          subscriptionData={subscriptionData}
          isProd={isProd}
        />
      </Suspense>
    </div>
  );
}

function SubscriptionPlansSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-[400px] w-full" />
        ))}
      </div>
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}

async function SubscriptionPlansWrapper({ 
  userId, 
  subscriptionData,
  isProd
}: { 
  userId: string | null, 
  subscriptionData: { 
    currentPlan: SubscriptionPlanType | null, 
    subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | null
    error?: string 
  },
  isProd: boolean
}) {
  const { currentPlan, subscriptionStatus, error } = subscriptionData;

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
export default Page;