import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { migratedStorage } from '@/lib/storage';
import { fetchWithTimeout } from '@/lib/http';

// Exporting QuizType so it can be imported in other files
export type QuizType = 'blanks' | 'openended' | 'mcq' | 'code' | 'flashcard' | 'ordering';

function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buildQuizUrl = (slug: string, type: QuizType) => {
  return `/dashboard/${type}/${slug}`;
};

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Format seconds into minutes:seconds format
 * @param seconds - Number of seconds to format
 * @returns Formatted time string (e.g., "5:23")
 */
function formatDuration(seconds: number): string {
  if (!seconds) return '--:--';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function saveToken(token: string) {
  migratedStorage.setItem('authToken', token, { secure: true });
}

function getToken() {
  return migratedStorage.getItem<string>('authToken', { secure: true });
}

const fetchSubscriptionStatus = async (timeout = 15000) => {
  const res = await fetchWithTimeout(
    '/api/subscriptions/status',
    {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
    timeout
  );
  if (res.status === 401) return { isFree: true };
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

const getAIModel = (userType: string): string => {
  switch (userType) {
    case 'FREE':
    case 'BASIC':
      return 'gpt-3.5-turbo-1106';
    case 'PREMIUM':
    case 'ULTIMATE':
      return 'gpt-4-1106-preview';
    default:
      return 'gpt-3.5-turbo-1106';
  }
};

/**
 * Get the AI model to use based on user type
 *
 * @param userType The user type (FREE, BASIC, PREMIUM, ULTIMATE)
 * @returns The AI model to use
 */
const getAIModelFromConfig = (userType: string): string => {
  // Import this way to avoid circular dependencies
  const { getAIProviderConfig } = require('./ai/config/config');
  const config = getAIProviderConfig();

  // Return the model for the user type, or default to FREE
  return config.models[userType] || config.models.FREE;
};

/**
 * Neobrutalism color utility for quiz components
 * Returns consistent color classes for type, difficulty, and state combinations
 * 
 * @param type - Quiz type (mcq, code, blanks, openended, flashcard)
 * @param difficulty - Difficulty level (easy, medium, hard)
 * @param state - Component state (default, active, loading, error)
 * @returns Object with consistent Neobrutalism color classes and values
 */
export function getColorClasses() {
  return {
    buttonPrimary:
      "bg-primary text-primary-foreground border-3 border-border neo-shadow hover:neo-shadow-lg hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] active:neo-shadow transition-all font-bold",
    buttonSecondary:
      "bg-secondary text-secondary-foreground border-3 border-border neo-shadow hover:neo-shadow-lg hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] active:neo-shadow transition-all font-bold",
    buttonAccent:
      "bg-accent text-accent-foreground border-3 border-border neo-shadow hover:neo-shadow-lg hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] active:neo-shadow transition-all font-bold",
    buttonIcon:
      "border-3 border-border neo-shadow hover:neo-shadow-lg hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all",
    cardPrimary: "border-3 border-border neo-shadow bg-card",
    cardSecondary: "border-3 border-border neo-shadow-lg bg-card",
    cardAccent: "border-3 border-primary neo-shadow-primary bg-card",
    badge: "border-2 border-border font-bold px-3 py-1",
    input:
      "border-3 border-border neo-shadow focus:neo-shadow-lg focus:translate-x-[-1px] focus:translate-y-[-1px] transition-all font-medium",
  }
}

