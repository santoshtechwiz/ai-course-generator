import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { nanoid } from 'nanoid';
import slugify from 'slugify';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



export function getBaseUrl() {
  if (typeof window !== "undefined") return "" // browser should use relative url
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL // SSR should use NEXTAUTH_URL
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
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

