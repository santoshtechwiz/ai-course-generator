import { z } from "zod"

// Schema for progress updates from video player
export const videoProgressSchema = z.object({
  courseId: z.union([z.string(), z.number()]).transform(val => Number(val)),
  chapterId: z.union([z.string(), z.number()]).transform(val => Number(val)),
  videoId: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  playedSeconds: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
  completed: z.boolean().optional(),
})

// Schema for quiz progress updates
export const quizProgressSchema = z.object({
  attemptId: z.string().min(1, "Attempt ID is required"),
  questionIndex: z.number().int().min(0, "Question index must be non-negative"),
  answerIndex: z.number().int().min(-1, "Answer index must be -1 or greater"),
})

// Schema for course progress API requests
export const courseProgressSchema = z.object({
  currentChapterId: z.union([z.string(), z.number()]).transform(val => Number(val)),
  videoId: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  completedChapters: z.array(z.number()).optional(),
  isCompleted: z.boolean().optional(),
  playedSeconds: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
})

// Schema for progress response
export const progressResponseSchema = z.object({
  progress: z.object({
    id: z.number(),
    userId: z.string(),
    courseId: z.number(),
    currentChapterId: z.number(),
    currentUnitId: z.number().nullable(),
    completedChapters: z.union([z.string(), z.array(z.number())]),
    progress: z.number(),
    timeSpent: z.number(),
    isCompleted: z.boolean(),
    completionDate: z.date().nullable(),
    quizProgress: z.any().nullable(),
    notes: z.string().nullable(),
    bookmarks: z.string().nullable(),
    lastInteractionType: z.string().nullable(),
    interactionCount: z.number(),
    engagementScore: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastAccessedAt: z.date(),
  }).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  details: z.any().optional(),
})

// Type exports
export type VideoProgress = z.infer<typeof videoProgressSchema>
export type QuizProgress = z.infer<typeof quizProgressSchema>
export type CourseProgress = z.infer<typeof courseProgressSchema>
export type ProgressResponse = z.infer<typeof progressResponseSchema>

// Validation functions
export const validateVideoProgress = (data: unknown): VideoProgress => {
  return videoProgressSchema.parse(data)
}

export const validateQuizProgress = (data: unknown): QuizProgress => {
  return quizProgressSchema.parse(data)
}

export const validateCourseProgress = (data: unknown): CourseProgress => {
  return courseProgressSchema.parse(data)
}

export const validateProgressResponse = (data: unknown): ProgressResponse => {
  return progressResponseSchema.parse(data)
}