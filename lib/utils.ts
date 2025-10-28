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
 * Modern design system utility for components
 * Returns consistent, accessible design system classes
 *
 * @returns Object with modern design system classes
 */
export function getColorClasses() {
  return {
    buttonPrimary: "bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-border)] hover:bg-[var(--color-primary)]/90 hover:scale-105 hover:shadow-lg transition-all duration-200",
    buttonSecondary: "bg-[var(--color-secondary)] text-[var(--color-bg)] border-[var(--color-border)] hover:bg-[var(--color-secondary)]/90 hover:scale-105 hover:shadow-lg transition-all duration-200",
    buttonAccent: "bg-[var(--color-accent)] text-[var(--color-bg)] border-[var(--color-border)] hover:bg-[var(--color-accent)]/90 hover:scale-105 hover:shadow-lg transition-all duration-200",
    buttonIcon: "bg-[var(--color-secondary)] text-[var(--color-bg)] border-[var(--color-border)] hover:bg-[var(--color-secondary)]/90 hover:scale-105 hover:shadow-lg transition-all duration-200",
    cardPrimary: "bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text)]",
    cardSecondary: "bg-[var(--color-muted)] border-[var(--color-border)] text-[var(--color-text)]",
    cardAccent: "bg-[var(--color-card)] border-[var(--color-primary)]/20 text-[var(--color-text)]",
    badge: "bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-border)]",
    input: "bg-[var(--color-input)] border-[var(--color-border)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]",
  }
}

