import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Stripe from 'stripe';
import { stripeConfig,Plan } from "@/config/stripeConfig";
import { nanoid } from 'nanoid';
import slugify from 'slugify';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function createCheckoutSession(plan: Plan) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-10-28.acacia',
    typescript: true,
  });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        plan.priceId
          ? {
              price: plan.priceId, // Use predefined priceId
              quantity: 1,
            }
          : {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: plan.name,
                  description: plan.description,
                },
                unit_amount: plan.unitAmount ? plan.unitAmount * 100 : undefined,
              },
              quantity: 1,
            },
      ],
      mode: plan.type === 'subscription' ? 'subscription' : 'payment',
      success_url: stripeConfig.successUrl,
      cancel_url: stripeConfig.cancelUrl,
      metadata: {
        planType: plan.type,
        tokenAmount: plan.unitAmount || 0,
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export function formatTimeDelta(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  const secs = Math.floor(seconds - hours * 3600 - minutes * 60);
  const parts = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (secs > 0) {
    parts.push(`${secs}s`);
  }
  return parts.join(" ");
}

export const formatTime = (time: any): string => {
  time = Math.round(time);

  let minutes: number | string = Math.floor(time / 60);
  let seconds: number | string = time - minutes * 60;

  seconds = seconds < 10 ? "0" + seconds : seconds;

  return `${minutes}:${seconds}`;
};



export function generateSlug(text: string): string {
  const baseSlug = slugify(text, {
    lower: true,
    strict: true,
    trim: true
  });
  const uniqueId = nanoid(6); // Generate a short, unique string
  return `${baseSlug}-${uniqueId}`;
}

// export const formatTime = (seconds: number): string => {
//   const date = new Date(seconds * 1000);
//   const hh = date.getUTCHours();
//   const mm = date.getUTCMinutes();
//   const ss = date.getUTCSeconds().toString().padStart(2, '0');
//   if (hh) {
//     return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
//   }
//   return `${mm}:${ss}`;
// };
export const getVideoQualityOptions = (availableQualities: string[]): { value: string; label: string }[] => {
  if (availableQualities.length === 0) {
    return [{ value: 'auto', label: 'Auto' }];
  }
  return [
    { value: 'auto', label: 'Auto' },
    ...availableQualities.map(quality => ({
      value: quality,
      label: quality === 'tiny' ? '144p' : quality.includes('hd') ? quality.toUpperCase() : `${quality}p`,
    })),
  ];
};

export const PLAYBACK_SPEEDS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
];

