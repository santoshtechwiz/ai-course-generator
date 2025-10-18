import { nanoid } from 'nanoid';
import slugify from 'slugify';
import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { migratedStorage } from '@/lib/storage';
import { fetchWithTimeout } from '@/lib/http';

// Exporting QuizType so it can be imported in other files
export type QuizType = 'blanks' | 'openended' | 'mcq' | 'code' | 'flashcard';

export function copyToClipboard(text: string): Promise<void> {
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
export function formatDuration(seconds: number): string {
  if (!seconds) return '--:--';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function saveToken(token: string) {
  migratedStorage.setItem('authToken', token, { secure: true });
}

export function getToken() {
  return migratedStorage.getItem<string>('authToken', { secure: true });
}

export const fetchSubscriptionStatus = async (timeout = 15000) => {
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

export const getAIModel = (userType: string): string => {
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
export const getAIModelFromConfig = (userType: string): string => {
  // Import this way to avoid circular dependencies
  const { getAIProviderConfig } = require('./ai/config');
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
export const getColorClasses = (
  type?: 'mcq' | 'code' | 'blanks' | 'openended' | 'flashcard',
  difficulty?: 'easy' | 'medium' | 'hard',
  state?: 'default' | 'active' | 'loading' | 'error'
) => {
  // Base Neobrutalism colors
  const colors = {
    black: '#000000',
    white: '#FFFFFF',
    yellow: '#FDE047',      // Bright yellow
    blue: '#3B82F6',        // Bright blue
    red: '#EF4444',         // Bright red
    green: '#10B981',       // Bright green
    purple: '#A855F7',      // Bright purple
    cyan: '#06B6D4',        // Bright cyan
    amber: '#F59E0B',       // Bright amber
    gray: '#6B7280',        // Medium gray
  };

  // Type-based colors (for quiz types)
  const typeColors = {
    mcq: colors.blue,
    code: colors.green,
    blanks: colors.amber,
    openended: colors.purple,
    flashcard: colors.cyan,
  };

  // Type-based light backgrounds
  const typeLightBgs = {
    mcq: '#EFF6FF',        // Blue 50
    code: '#ECFDF5',       // Green 50
    blanks: '#FEF3C7',     // Amber 50
    openended: '#FAF5FF',  // Purple 50
    flashcard: '#ECFEFF',  // Cyan 50
  };

  // Difficulty-based colors
  const difficultyColors = {
    easy: colors.green,
    medium: colors.amber,
    hard: colors.red,
  };

  // Stats colors for ratings, views, likes
  const statsColors = {
    rating: colors.yellow,
    views: colors.blue,
    likes: colors.red,
  };

  // State-based shadow adjustments
  const stateStyles = {
    default: 'shadow-[4px_4px_0px_0px_#000000]',
    active: 'shadow-[6px_6px_0px_0px_#000000]',
    loading: 'opacity-70 shadow-[4px_4px_0px_0px_#000000]',
    error: 'border-red-500 shadow-[4px_4px_0px_0px_#FF0000]',
  };

  const baseColor = type ? typeColors[type] : colors.blue;
  const lightBg = type ? typeLightBgs[type] : typeLightBgs.mcq;
  const difficultyColor = difficulty ? difficultyColors[difficulty] : baseColor;
  const stateStyle = state ? stateStyles[state] : stateStyles.default;

  return {
    // ========== CARD VARIANTS ==========
    // Primary Card (Main content containers)
    cardPrimary: `bg-white border-4 border-black rounded-xl ${stateStyle} hover:shadow-[8px_8px_0px_0px_#000000] transition-all duration-100`,
    
    // Secondary Card (Sidebar, recommendations)
    cardSecondary: `bg-white border-3 border-black rounded-lg shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] transition-all duration-100`,
    
    // Tertiary Card (Stats, badges, small info)
    cardTertiary: `bg-white border-2 border-black rounded-md shadow-[2px_2px_0px_0px_#000000]`,
    
    // Legacy card (backwards compatibility)
    card: `bg-white border-4 border-black ${stateStyle} hover:shadow-[6px_6px_0px_0px_#000000] transition-all duration-100`,

    // ========== BUTTON VARIANTS ==========
    // Primary Action Button
    buttonPrimary: `bg-black text-white border-2 border-black rounded-lg px-6 py-3 font-bold uppercase text-sm shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] hover:translate-y-[-2px] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_#000000] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed`,
    
    // Secondary Action Button (Outlined)
    buttonSecondary: `bg-white text-black border-2 border-black rounded-lg px-6 py-3 font-bold uppercase text-sm shadow-[4px_4px_0px_0px_#000000] hover:bg-gray-50 hover:shadow-[6px_6px_0px_0px_#000000] transition-all duration-100`,
    
    // Icon Button
    buttonIcon: `bg-white text-black border-2 border-black rounded-md p-2 shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all duration-100`,
    
    // Colored Button (Type-specific) - requires inline style for bg
    buttonColored: `border-2 border-black rounded-lg px-6 py-3 font-bold uppercase text-sm text-white shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] hover:translate-y-[-2px] transition-all duration-100`,
    
    // Legacy button (backwards compatibility)
    button: `bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] hover:translate-y-[-2px] transition-all duration-100 font-bold uppercase`,

    // ========== BADGE VARIANTS ==========
    // Type Badge (Black background)
    badgeType: `inline-flex items-center gap-2 bg-black text-white border-2 border-black rounded-md px-3 py-1 font-bold uppercase text-xs shadow-[2px_2px_0px_0px_#000000]`,
    
    // Status Badge (Colored) - requires inline style for bg
    badgeStatus: `inline-flex items-center gap-2 text-black border-2 border-black rounded-md px-3 py-1 font-bold uppercase text-xs shadow-[2px_2px_0px_0px_#000000]`,
    
    // Count Badge
    badgeCount: `inline-flex items-center justify-center bg-white text-black border-2 border-black rounded-full w-6 h-6 font-bold text-xs shadow-[2px_2px_0px_0px_#000000]`,
    
    // Legacy badge (backwards compatibility)
    badge: `bg-black text-white border-2 border-black px-2 py-1 font-bold uppercase text-xs rounded-sm`,
    
    // Stats badge styles (colored)
    statsBadge: `border-2 border-black px-2 py-1 font-bold text-xs rounded-sm shadow-[2px_2px_0px_0px_#000000]`,

    // ========== INPUT VARIANTS ==========
    // Text Input
    inputText: `w-full bg-white text-black border-3 border-black rounded-lg px-4 py-3 font-medium text-base shadow-[4px_4px_0px_0px_#000000] focus:outline-none focus:shadow-[6px_6px_0px_0px_#3B82F6] focus:border-blue-500 transition-all duration-100 placeholder:text-gray-400`,
    
    // Textarea
    inputTextarea: `w-full bg-white text-black border-3 border-black rounded-lg px-4 py-3 font-medium text-base shadow-[4px_4px_0px_0px_#000000] focus:outline-none focus:shadow-[6px_6px_0px_0px_#3B82F6] focus:border-blue-500 transition-all duration-100 placeholder:text-gray-400 resize-vertical min-h-[120px]`,
    
    // Radio/Checkbox Option
    inputOption: `flex items-center gap-3 p-4 bg-white border-3 border-black rounded-lg cursor-pointer transition-all duration-100 hover:bg-gray-50 hover:shadow-[4px_4px_0px_0px_#000000]`,

    // ========== LAYOUT UTILITIES ==========
    // Container
    container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`,
    
    // Section spacing
    section: `space-y-6`,
    
    // Grid layouts
    gridThreeCol: `grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6`,
    gridTwoCol: `grid grid-cols-1 lg:grid-cols-2 gap-6`,

    // ========== ICON CONTAINER ==========
    iconContainer: `p-2 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000000] flex items-center justify-center`,

    // ========== TEXT UTILITIES ==========
    text: {
      primary: 'text-black',
      secondary: 'text-gray-700',
      muted: 'text-gray-500',
      white: 'text-white',
    },

    // ========== BORDER UTILITIES ==========
    border: {
      thin: 'border-2 border-black',
      medium: 'border-3 border-black',
      thick: 'border-4 border-black',
    },

    // ========== SHADOW UTILITIES ==========
    shadow: {
      xs: 'shadow-[2px_2px_0px_0px_#000000]',
      sm: 'shadow-[4px_4px_0px_0px_#000000]',
      md: 'shadow-[6px_6px_0px_0px_#000000]',
      lg: 'shadow-[8px_8px_0px_0px_#000000]',
      xl: 'shadow-[12px_12px_0px_0px_#000000]',
    },

    // ========== DYNAMIC COLOR VALUES ==========
    bgColor: baseColor,
    lightBg: lightBg,
    difficultyColor: difficultyColor,
    statsColors: statsColors,
    borderColor: colors.black,
    hoverColor: colors.black,

    // ========== RAW COLOR VALUES ==========
    colors: colors,
  };
};
