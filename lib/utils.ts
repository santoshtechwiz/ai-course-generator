import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { nanoid } from 'nanoid';
import slugify from 'slugify';
import { QuizType } from "@/app/types/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };

  const parsedDate = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("en-US", options).format(parsedDate);
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

export const extractUserAnswer = (answer: Object): string | string[] => {
  if (typeof answer === "object" && answer !== null) {
    if ("userAnswer" in answer && typeof answer.userAnswer === "string") {
      return answer.userAnswer;
    }
    if ("answer" in answer && typeof answer.answer === "string") {
      return answer.answer;
    }
  }
  return "";
};

export const buildQuizUrl = (slug: string, type: QuizType) => {

  switch (type) {
    case "mcq":
      return `/dashboard/mcq/${slug}`
    case "fill-blanks":
      return `/dashboard/blanks/${slug}`
    case "openended":
      return `/dashboard/openended/${slug}`
    case "flashcard":
      return `/dashboard/flashcard/${slug}`
    default:
      return `/dashboard/quiz/${slug}`
  }
}