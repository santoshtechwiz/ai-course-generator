import { CodeChallenge } from "@/app/types"
import OpenAI from "openai"


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateQuiz(req: Request) {
  const { language, difficulty } = await req.json()

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a coding quiz generator. Create concise, challenging questions.",
        },
        {
          role: "user",
          content: `Generate 5 ${difficulty} level coding quizzes on ${language}. Include brief code snippets if relevant.`,
        },
      ],
      functions: [
        {
          name: "create_quizzes",
          description: "Create multiple coding quizzes with questions, code snippets, and answer options.",
          parameters: {
            type: "object",
            properties: {
              quizzes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    codeSnippet: { type: "string" },
                    options: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 4,
                      maxItems: 4,
                    },
                    correctAnswer: { type: "string" },
                  },
                  required: ["question", "options", "correctAnswer"],
                },
                minItems: 1,
                maxItems: 5,
              },
            },
            required: ["quizzes"],
          },
        },
      ],
      function_call: { name: "create_quizzes" },
    })

    const functionCall = response.choices[0].message.function_call
    const quizData: { quizzes: CodeChallenge[] } = JSON.parse(functionCall.arguments)

    return Response.json(quizData.quizzes)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to generate quizzes" }, { status: 500 })
  }
}

