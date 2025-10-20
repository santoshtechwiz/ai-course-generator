import type { Quiz } from "@/app/types/types"
import type { ChatCompletionParams } from "@/lib/ai/interfaces"
import { OpenAI } from "openai"
import https from "https"
import { defaultAIProvider } from "@/lib/ai"

/**
 * @deprecated Use the AIProvider interface and defaultAIProvider from @/lib/ai instead
 */
const agent = new https.Agent({
  rejectUnauthorized: false,
})

/**
 * @deprecated Use defaultAIProvider from @/lib/ai instead
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  httpAgent: agent,
})

/**
 * @deprecated Use defaultAIProvider.generateOpenEndedQuiz or defaultAIProvider.generateFillInTheBlanksQuiz instead
 */
export const generateQuizFlexible = async (params: ChatCompletionParams): Promise<Quiz> => {
  const { model, messages, functions, functionCall } = params

  const response = await openai.chat.completions.create({
    model,
    messages: messages as any,
    functions,
    function_call: functionCall as any,
  })

  const result = JSON.parse(response.choices[0].message?.function_call?.arguments || "{}")

  if (!result.quiz_title || !result.questions || !Array.isArray(result.questions)) {
    throw new Error("Invalid response format: quiz_title or questions array is missing.")
  }

  return result as Quiz
}

export default openai
