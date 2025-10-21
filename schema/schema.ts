import { z } from "zod"

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  isPublic: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  averageRating: z.number().min(0).max(5).optional(),
  totalRatings: z.number().min(0).optional(),
  progress: z.number().min(0).max(100).optional(),
  isFavorite: z.boolean().optional(),
})
const codeQuizSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Topic must be at least 3 characters long")
    .max(100, "Topic must be at most 100 characters long")
    .refine(
      (val) => val.length > 0 && val !== " ".repeat(val.length),
      "Topic cannot be empty or contain only spaces"
    ),
  amount: z.number().min(1, "At least 1 question is required").max(15, "Maximum 20 questions allowed"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  language: z.string().default("javascript"),
})
const createCourseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().trim().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  category: z.string().trim().min(1, "Category is required").max(50, "Category must be less than 50 characters"),
  units: z.array(z.string().trim().min(1, "Unit title is required")).min(1, "At least one unit is required"),
})

const quizSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Topic must be at least 3 characters long")
    .max(100, "Topic must be at most 100 characters long")
    .refine(
      (val) => val.length > 0 && val !== " ".repeat(val.length),
      "Topic cannot be empty or contain only spaces"
    ),
  amount: z.number().min(1, "At least 1 question is required").max(15, "Maximum 20 questions allowed"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.enum(["mcq"]).default("mcq"),
  userType: z.enum(["FREE", "BASIC", "PREMIUM"]).default("FREE").optional(),
  topic: z.string().optional(),
  prompt: z.string().optional(),
})

export const createChaptersSchema = z.object({
  title: z.string().trim().min(1).max(100),
  units: z.array(z.string().trim()),
  category: z.string().trim().min(1, "Category is required").max(50, "Category must be less than 50 characters"),
  description: z.string().trim().min(1).max(1000),
})

const quizCreationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, {
      message: "Topic must be at least 4 characters long",
    })
    .max(50, {
      message: "Topic must be at most 50 characters long",
    })
    .refine(
      (val) => val.length > 0 && val !== " ".repeat(val.length),
      "Topic cannot be empty or contain only spaces"
    ),
  type: z.enum(["mcq", "open_ended"]).default("mcq"),
  amount: z.number().min(1).max(15),
  difficulty: z.enum(["easy", "medium", "hard"]),
  userType: z.enum(["FREE", "BASIC", "PREMIUM"]).default("FREE").optional(),
})
const getQuestionsSchema = z.object({
  title: z.string(),
  amount: z.number().int().positive().min(1).max(20),
  type: z.enum(["mcq"]),
  difficulty: z.enum(["easy", "medium", "hard"]),

})

const checkAnswerSchema = z.object({
  userInput: z.string(),
  questionId: z.string(),
})

const endGameSchema = z.object({
  gameId: z.string(),
})

export const blanksQuizSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters long")
    .max(200, "Title must be at most 200 characters long")
    .refine(
      (val) => val.length > 0 && val !== " ".repeat(val.length),
      "Title cannot be empty or contain only spaces"
    ),
  type: z.enum(["blanks"]).default("blanks"),
  amount: z.number().min(1, "At least 1 question is required").max(15, "Maximum 20 questions allowed"),
  difficulty: z.enum(["easy", "medium", "hard"]),
})

export type CreateCourseInput = z.infer<typeof createCourseSchema>
export {  createCourseSchema, quizSchema, codeQuizSchema }
