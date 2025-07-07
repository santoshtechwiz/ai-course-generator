import type { FlashCard } from "@/app/types/types"
import { defaultAIProvider } from "@/lib/ai"

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
