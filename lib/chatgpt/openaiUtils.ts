import { Quiz, QuizGenerationParams } from "@/app/types/types"
import openai from "./openAI"




export const generateQuizFlexible = async (params: QuizGenerationParams): Promise<Quiz> => {
  const { model, messages, functions, functionCall } = params

  const response = await openai.chat.completions.create({
    model,
    messages,
    functions,
    function_call: functionCall,
  })

  const result = JSON.parse(response.choices[0].message?.function_call?.arguments || "{}")

  if (!result.quiz_title || !result.questions || !Array.isArray(result.questions)) {
    throw new Error("Invalid response format: quiz_title or questions array is missing.")
  }

  return result as Quiz
}

