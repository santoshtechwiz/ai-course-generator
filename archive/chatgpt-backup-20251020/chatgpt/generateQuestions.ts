import { z } from "zod"

import { generateMcqForUserInput } from "./userMcqQuiz"

import { getQuestionsSchema } from "@/schema/schema"

import type { Question } from "@/app/types/result-types"

export async function generateQuestions(req: unknown): Promise<{ questions: Question[] }> {
  try {
    // Validate the input using Zod
    const { amount, title, type, difficulty } = getQuestionsSchema.parse(req)

    console.log(`Generating ${amount} ${type} questions about ${title}`)

    // Generate questions based on the type
    const questions =
      await generateMcqForUserInput(title, amount, difficulty, type);


    return { questions }
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map((i) => i.message).join(", ")}`)
    }
    // Re-throw other errors
    throw error
  }
}
