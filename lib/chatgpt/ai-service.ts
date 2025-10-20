import type { FlashCard } from "@/app/types/types"
import { defaultAIProvider } from "@/lib/ai"

// Ordering/Sequencing Quiz types
export interface OrderingQuizStep {
  id: number
  description: string
  explanation?: string
}

/**
 * Represents a full ordering quiz question where users must arrange steps in logical order.
 */
export interface OrderingQuizQuestion {
  id: string | number
  title: string
  topic: string
  steps: OrderingQuizStep[]
  description?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  type: 'ordering'

  /** The correct order of step IDs, e.g., [0, 1, 2, 3] */
  correctOrder?: number[]

  /** The total number of steps, derived for validation or progress tracking */
  numberOfSteps?: number

  /** Optional explanations for each step (used when showing results) */
  explanations?: string[]
}


export async function generateFlashCards(title: string, count = 5): Promise<FlashCard[]> {
  try {
    const result = await defaultAIProvider.generateChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI that generates structured flashcards.",
        },
        {
          role: "user",
          content: `Generate ${count} flash cards about "${title}".
          Each flashcard should have a challenging question and a concise yet comprehensive answer.
          
          Respond as a function call using the "generate_flashcards" function schema.`,
        },
      ],
      functions: [
        {
          name: "generate_flashcards",
          description: "Generates a list of flashcards with questions and answers.",
          parameters: {
            type: "object",
            properties: {
              flashcards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                  required: ["question", "answer"],
                },
              },
            },
            required: ["flashcards"],
          },
        },
      ],
      functionCall: { name: "generate_flashcards" },
    })

    if (!result.functionCall || result.functionCall.name !== "generate_flashcards") {
      throw new Error("Function call not received from API.")
    }

    const parsedArguments = JSON.parse(result.functionCall.arguments)
    return parsedArguments.flashcards.map((card: any) => ({
      id: Math.floor(Math.random() * 1000000), // Generate a temporary ID
      question: card.question,
      answer: card.answer,
    }))
  } catch (error) {
    console.error("Failed to generate flashcards:", error)
    throw new Error(`Error generating flashcards: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Generate an ordering/sequencing quiz question with steps to be arranged in correct order
 * @param topic - The technical topic for the quiz (e.g., "HTTP Request Cycle", "Git Workflow")
 * @param numberOfSteps - Number of steps (4-7 recommended)
 * @param userPlan - User's subscription plan ('FREE', 'PREMIUM', 'PRO')
 * @returns Ordering quiz question with shuffled steps
 */
export async function generateOrderingQuiz(
  topic: string,
  numberOfSteps: number = 5,
  userPlan: 'FREE' | 'PREMIUM' | 'PRO' = 'FREE'
): Promise<OrderingQuizQuestion> {
  try {
    // ✅ Subscription control
    const maxQuizzesPerDay = {
      FREE: 2,
      PREMIUM: 10,
      PRO: 50,
    }

    // ✅ Validate step count range
    if (numberOfSteps < 4 || numberOfSteps > 7) {
      throw new Error("Number of steps must be between 4 and 7")
    }

    // ✅ Updated system and user prompt to prevent missing data
    const result = await defaultAIProvider.generateChatCompletion({
      model: "gpt-4o-mini", // More reliable structured responses
      messages: [
        {
          role: "system",
          content: `You are an expert AI that creates logical, step-by-step technical ordering (sequencing) quizzes.
Each quiz represents a clear technical process with well-defined steps.
Output must always follow the provided JSON schema and contain no empty fields.`,
        },
        {
          role: "user",
          content: `
Generate an ordering quiz about "${topic}".

**Requirements:**
- Create exactly ${numberOfSteps} sequential steps.
- Each step must be a clear action or stage in the process (no placeholders, no empty text).
- Steps must be ordered correctly from first to last.
- Provide a short, meaningful explanation for each step.
- Ensure the steps form a coherent and complete workflow.
- Avoid vague or incomplete descriptions.

**Example topics:** Git Workflow, Docker Container Deployment, Database Backup Process, API Request Lifecycle, CI/CD Pipeline, etc.

Respond ONLY as a function call using the "generate_ordering_quiz" schema.`,
        },
      ],
      functions: [
        {
          name: "generate_ordering_quiz",
          description: "Generates a well-structured technical ordering quiz with complete steps and explanations.",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Quiz title, e.g., 'Docker Deployment Pipeline'",
              },
              description: {
                type: "string",
                description: "Short description of what the quiz tests.",
              },
              steps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    description: { type: "string" },
                    explanation: { type: "string" },
                  },
                  required: ["description"],
                },
              },
              difficulty: {
                type: "string",
                enum: ["easy", "medium", "hard"],
              },
            },
            required: ["title", "description", "steps", "difficulty"],
          },
        },
      ],
      functionCall: { name: "generate_ordering_quiz" },
    })

    // ✅ Validate AI response
    if (!result.functionCall || result.functionCall.name !== "generate_ordering_quiz") {
      throw new Error("Invalid AI response: Missing function call.")
    }

    const parsedArguments = JSON.parse(result.functionCall.arguments)

    // ✅ Clean + transform response for UI
    const steps: OrderingQuizStep[] = parsedArguments.steps
      .filter((step: any) => step.description?.trim()) // remove blanks
      .map((step: any, index: number) => ({
        id: index,
        description: step.description.trim(),
        explanation: step.explanation?.trim() || "",
      }))

    // ✅ Final validation
    if (steps.length < 4) {
      throw new Error("Generated quiz has too few steps. Try again.")
    }

    return {
      id: Math.floor(Math.random() * 1_000_000),
      title: parsedArguments.title || topic,
      topic,
      steps,
      description: parsedArguments.description || `Arrange the steps of ${topic} in the correct order.`,
      difficulty: parsedArguments.difficulty || "medium",
      type: "ordering",
      correctOrder: steps.map((s) => s.id),
      numberOfSteps: steps.length,
    }
  } catch (error) {
    console.error("Failed to generate ordering quiz:", error)
    throw new Error(
      `Error generating ordering quiz: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/**
 * Validate user's ability to generate ordering quizzes based on subscription plan
 * @param userPlan - User's subscription plan
 * @param quizzesGeneratedToday - Number of quizzes generated today
 * @returns Object with canGenerate flag and reason if not allowed
 */
export function checkOrderingQuizAccess(
  userPlan: 'FREE' | 'PREMIUM' | 'PRO' = 'FREE',
  quizzesGeneratedToday: number = 0
): { canGenerate: boolean; reason?: string; limitPerDay: number } {
  const limits = {
    'FREE': 2,
    'PREMIUM': 10,
    'PRO': 50,
  }

  const limitPerDay = limits[userPlan]

  if (quizzesGeneratedToday >= limitPerDay) {
    return {
      canGenerate: false,
      reason: `You have reached your daily limit of ${limitPerDay} quizzes for the ${userPlan} plan.`,
      limitPerDay,
    }
  }

  return {
    canGenerate: true,
    limitPerDay,
  }
}
