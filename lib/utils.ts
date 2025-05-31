
import { nanoid } from "nanoid"
import slugify from "slugify"
import type { QuizType } from "@/app/types/types"
import clsx, { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const buildQuizUrl = (slug: string, type: QuizType) => {
  return `/dashboard/(quiz)/${type}/quizzes/${slug}`
}