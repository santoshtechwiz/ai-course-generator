'use client';

import React, { MouseEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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
  requiredCredits: number;
  loadingLabel?: string;
}

export function CreditButton({
  label,
  onClick,
  requiredCredits,
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
      router.push('/dahboard/subscription');
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
  const hasEnoughCredits = subscriptionStatus && subscriptionStatus.credits >= requiredCredits;
  const isDisabled = isLoading || !isAuthenticated || !hasEnoughCredits;

  let buttonText = label;
  let tooltipContent = '';

  if (!isAuthenticated) {
    buttonText = 'Sign in to Create';
    tooltipContent = 'You need to sign in to create this item';
  } else if (!hasEnoughCredits) {
    buttonText = 'Subscribe for Credits';
    tooltipContent = `You need ${requiredCredits} credit${requiredCredits > 1 ? 's' : ''} to create this item`;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            disabled={isDisabled}
            {...props}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingLabel}
              </>
            ) : (
              buttonText
            )}
          </Button>
        </TooltipTrigger>
        {isDisabled && (
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

