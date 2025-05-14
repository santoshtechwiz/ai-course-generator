
import { nanoid } from "nanoid"
import slugify from "slugify"
import type { QuizType } from "@/app/types/types"
import clsx, { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

