/**
 * Styling Utilities
 *
 * Consolidated styling utilities for consistent class name handling.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine class names with Tailwind merge
 * Consolidates the cn function from multiple files
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Conditional class names helper
 */
export function conditionalClass(
  condition: boolean,
  trueClass: string,
  falseClass?: string
): string {
  return condition ? trueClass : falseClass || '';
}

/**
 * Build dynamic class names from object
 */
export function buildClasses(classMap: Record<string, boolean>): string {
  return Object.entries(classMap)
    .filter(([, condition]) => condition)
    .map(([className]) => className)
    .join(' ');
}

export type { ClassValue } from 'clsx';
