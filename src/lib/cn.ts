import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compose Tailwind class names with conditional logic + conflict resolution.
 * Usage: cn('px-2', isActive && 'bg-blue-500', 'px-4') → 'bg-blue-500 px-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
