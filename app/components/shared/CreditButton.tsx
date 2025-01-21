'use client';

import React, { MouseEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, CheckCircle, User } from 'lucide-react';
import { useSubscriptionStatus } from '@/hooks/useSubscroption';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreditButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  label: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => Promise<void> | void;
  requiredCredits?: number;
  loadingLabel?: string;
}

export function CreditButton({
  label,
  onClick,
  requiredCredits = 0,
  loadingLabel = 'Processing...',

  ...props
}: CreditButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const subscriptionStatus = useSubscriptionStatus();

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (status === 'unauthenticated') {
      const callbackUrl = encodeURIComponent(pathname || '/');
      await signIn('credentials', { callbackUrl: `/auth/signin?callbackUrl=${callbackUrl}` });
      setIsLoading(false);
      return;
    }

    if (!subscriptionStatus || subscriptionStatus.credits < requiredCredits) {
      router.push('/dashboard/subscription');
      setIsLoading(false);
      return;
    }

    if (onClick) {
      try {
        await onClick(e);
      } catch (error) {
        console.error('Error in CreditButton onClick:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  const isAuthenticated = status === 'authenticated';
  const hasEnoughCredits = (subscriptionStatus?.credits ?? 0) >= requiredCredits;
  const isDisabled = isLoading || !isAuthenticated || !hasEnoughCredits;

  const getButtonIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (!isAuthenticated) return <User className="h-4 w-4" />;
    if (!hasEnoughCredits) return <Lock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const tooltipContent = !isAuthenticated
    ? 'Sign in to proceed.'
    : !hasEnoughCredits
    ? `You need ${requiredCredits} credit${requiredCredits > 1 ? 's' : ''} to proceed.`
    : '';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            disabled={isDisabled}
            {...props}
          >
            {isDisabled ? getButtonIcon() : label}
            {isLoading && (
              <span className="ml-2">{loadingLabel}</span>
            )}
          </Button>
        </TooltipTrigger>
        {isDisabled && tooltipContent && (
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
