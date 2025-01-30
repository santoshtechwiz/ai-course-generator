import { z } from "zod";

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
const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  category: z.string().min(1, "Category is required"),
  units: z.array(z.string().min(1, "Unit title is required")).min(1, "At least one unit is required"),
})

const quizSchema = z.object({
    topic: z.string().min(3, "Topic must be at least 3 characters long").max(100, "Topic must be at most 100 characters long"),
    amount: z.number().min(1, "At least 1 question is required").max(15, "Maximum 20 questions allowed"),
    difficulty: z.enum(["easy", "medium", "hard"]),
    userType: z.enum(["FREE", "BASIC", "PRO"]).default("FREE").optional(),
  });



export const createChaptersSchema = z.object({
  title: z.string().min(1).max(100),
  units: z.array(z.string()),
  category: z.string().nonempty("Must Select Category"),
  description: z.string().min(1).max(1000),
});

export const quizCreationSchema = z.object({
  topic: z
    .string()
    .min(4, {
      message: "Topic must be at least 4 characters long",
    })
    .max(50, {
      message: "Topic must be at most 50 characters long",
    }),
  type: z.enum(["mcq", "open_ended"]).default("mcq"),
  amount: z.number().min(1).max(15),
  difficulty: z.enum(["easy", "medium", "hard"]),
  userType: z.enum(["FREE", "BASIC", "PRO"]).default("FREE").optional(),
});
export const getQuestionsSchema = z.object({
  topic: z.string(),
  amount: z.number().int().positive().min(1).max(10),
  type: z.enum(["mcq", "open_ended"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  userType: z.enum(["FREE", "BASIC", "PRO"]).default("FREE").optional(),
});

export const checkAnswerSchema = z.object({
  userInput: z.string(),
  questionId: z.string(),
});

export const endGameSchema = z.object({
  gameId: z.string(),
});
export type CreateCourseInput = z.infer<typeof createCourseSchema>
export { updateSchema, createCourseSchema , quizSchema};