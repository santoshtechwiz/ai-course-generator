"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, RefreshCw, Info } from 'lucide-react';

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  action?: () => void;
  actionLabel?: string;
}

export function SubscriptionHealthCheck() {
  const { data: session, status: sessionStatus } = useSession();
  const subscription = useUnifiedSubscription();
  const [healthChecks, setHealthChecks] = useState<HealthCheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runHealthCheck = async () => {
    setIsRunning(true);
    const checks: HealthCheckResult[] = [];

    // Check 1: Session availability
    if (sessionStatus === 'loading') {
      checks.push({
        status: 'warning',
        message: 'Session is still loading...'
      });
    } else if (sessionStatus === 'unauthenticated') {
      checks.push({
        status: 'error',
        message: 'User is not authenticated'
      });
    } else if (session?.user) {
      checks.push({
        status: 'healthy',
        message: 'Session is available and valid'
      });

      // Check 2: Session data consistency
      const sessionCredits = session.user.credits;
      const subscriptionCredits = subscription.credits;
      
      if (typeof sessionCredits === 'number' && typeof subscriptionCredits === 'number') {
        const diff = Math.abs(sessionCredits - subscriptionCredits);
        if (diff > 2) {
          checks.push({
            status: 'warning',
            message: `Credit mismatch detected: Session (${sessionCredits}) vs Subscription (${subscriptionCredits})`,
            action: subscription.refreshSubscription,
            actionLabel: 'Sync Credits'
          });
        } else {
          checks.push({
            status: 'healthy',
            message: 'Credit values are synchronized'
          });
        }
      }

      // Check 3: Plan consistency  
      const sessionPlan = (session.user as any)?.plan || (session.user as any)?.userType;
      const subscriptionPlan = subscription.plan;
      
      if (sessionPlan && subscriptionPlan && sessionPlan.toUpperCase() !== subscriptionPlan.toUpperCase()) {
        checks.push({
          status: 'warning',
          message: `Plan mismatch: Session (${sessionPlan}) vs Subscription (${subscriptionPlan})`,
          action: subscription.refreshSubscription,
          actionLabel: 'Sync Plan'
        });
      } else {
        checks.push({
          status: 'healthy',
          message: 'Plan information is consistent'
        });
      }
    }

    // Check 4: API availability
    try {
      const response = await fetch('/api/subscriptions/status', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        checks.push({
          status: 'healthy',
          message: 'Subscription API is responding normally'
        });
      } else {
        checks.push({
          status: 'error',
          message: `Subscription API returned ${response.status}: ${response.statusText}`
        });
      }
    } catch (error) {
      checks.push({
        status: 'error',
        message: 'Subscription API is not accessible'
      });
    }

    setHealthChecks(checks);
    setIsRunning(false);
  };

  useEffect(() => {
    // Run initial health check after a short delay
    const timer = setTimeout(runHealthCheck, 1000);
    return () => clearTimeout(timer);
  }, []);

  const hasErrors = healthChecks.some(check => check.status === 'error');
  const hasWarnings = healthChecks.some(check => check.status === 'warning');

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  if (healthChecks.length === 0) {
    return (
      <Alert className="m-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Running Health Check...</AlertTitle>
        <AlertDescription>Checking subscription system status...</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="m-4 space-y-3">
      <Alert variant={hasErrors ? "destructive" : hasWarnings ? "default" : "default"}>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Subscription Health Check</AlertTitle>
        <AlertDescription>
          System status: {hasErrors ? 'Issues Detected' : hasWarnings ? 'Minor Issues' : 'All Systems Normal'}
        </AlertDescription>
      </Alert>

      {healthChecks.map((check, index) => (
        <Alert 
          key={index} 
          variant={check.status === 'error' ? 'destructive' : check.status === 'warning' ? 'default' : 'default'}
          className="text-sm"
        >
          {check.status === 'healthy' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {check.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          {check.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
          <AlertDescription className="flex items-center justify-between">
            <span>{check.message}</span>
            {check.action && (
              <Button
                size="sm"
                variant="outline"
                onClick={check.action}
                className="ml-2"
              >
                {check.actionLabel}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ))}

      <Button
        onClick={runHealthCheck}
        disabled={isRunning}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
        {isRunning ? 'Running...' : 'Run Health Check'}
      </Button>
    </div>
  );
}