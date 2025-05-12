import { z } from "zod"

import { generateMcqForUserInput, generateOpenEndedQuiz } from "./userMcqQuiz"

import { getQuestionsSchema } from "@/schema/schema"

import type { Question } from "@/app/types/types"

export async function generateQuestions(req: unknown): Promise<{ questions: Question[] }> {
  try {
    // Validate the input using Zod
    const { amount, title, type, difficulty, userType } = getQuestionsSchema.parse(req)

    console.log(`Generating ${amount} ${type} questions about ${title}`)

    // Generate questions based on the type
    const questions =
      type === "mcq"
        ? await generateMcqForUserInput(title, amount, difficulty, userType || "")
        : await generateOpenEndedQuiz(title, amount, userType)

    return questions
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map((i) => i.message).join(", ")}`)
    }
    // Re-throw other errors
    throw error
  }
}
