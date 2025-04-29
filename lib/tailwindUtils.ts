import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// import { nanoid } from "nanoid"
// import slugify from "slugify"
// import type { QuizType } from "@/app/types/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
