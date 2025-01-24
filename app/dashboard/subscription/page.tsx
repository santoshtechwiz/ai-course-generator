import { Suspense } from 'react';
import { getAuthSession } from "@/lib/authOptions";
import { SubscriptionService } from "@/services/subscriptionService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SubscriptionPlanType } from '@/config/subscriptionPlans';
import SubscriptionPlans from '@/app/dashboard/subscription/components/SubscriptionPlans';
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from 'react-error-boundary';

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Subscription Plans</h1>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<SubscriptionPlansSkeleton />}>
          <SubscriptionPlansWrapper 
            userId={userId} 
            getSubscriptionData={getSubscriptionData}
            isProd={isProd}
          />
        </Suspense>
      </ErrorBoundary>
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

function ErrorFallback({ error, resetErrorBoundary }: { 
  error: Error, 
  resetErrorBoundary: () => void 
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>An Error Occurred</AlertTitle>
      <AlertDescription>
        {error.message}
        <button 
          onClick={resetErrorBoundary} 
          className="ml-4 text-blue-600 underline"
        >
          Retry
        </button>
      </AlertDescription>
    </Alert>
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
    throw new Error(error);
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
