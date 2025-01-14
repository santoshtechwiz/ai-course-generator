'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plan } from '@/config/stripeConfig';

interface SubscribeButtonProps {
  plan: Plan;
}

export function SubscribeButton({ plan }: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: plan.priceId }),
      });
      console.log(response);
      const session = await response.json();
      console.log(session);
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.log('Error:', error);
      setIsLoading(false);
    }
  };
  console.log(plan);
  const buttonText = plan?.type === 'subscription' 
    ? `Subscribe to ${plan?.name}`
    : `Purchase ${plan?.name}`;

  return (
    <Button onClick={handlePurchase} disabled={isLoading}>
      {isLoading ? 'Processing...' : buttonText}
    </Button>
  );
}

