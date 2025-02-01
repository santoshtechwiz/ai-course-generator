import { CodeChallenge } from "@/app/types"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateCodingMCQs(
  language: string,
  subtopic: string,
  difficulty: string,
  questionCount: number = 2,
  userType: "FREE" | "BASIC" | "PREMIUM" = "FREE"
): Promise<CodeChallenge[]> {
  try {
    const model = userType === "PREMIUM" ? "gpt-4o-mini" : "gpt-3.5-turbo"
    const codingQuestionCount = Math.ceil(questionCount * 0.9) // 90% of questions should be coding

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are an AI that generates multiple-choice coding questions.`
        },
        {
          role: "user",
          content: `Generate ${questionCount} ${difficulty} multiple-choice questions about ${language} ${subtopic}. 
          At least ${codingQuestionCount} questions should involve coding problems.
          Each question should have one correct answer and three incorrect options.
          If the question involves code, put the code in a separate codeSnippet field.
          Ensure all code is properly formatted and indented.`
        }
      ],
      functions: [
        {
          name: "createCodingMCQ",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    codeSnippet: { type: "string" },
                    answer: { type: "string", description: "Correct answer, max 15 words" },
                    option1: { type: "string", description: "Incorrect option, max 15 words" },
                    option2: { type: "string", description: "Incorrect option, max 15 words" },
                    option3: { type: "string", description: "Incorrect option, max 15 words" },
                  },
                  required: ["question", "answer", "option1", "option2", "option3"],
                },
              },
            },
            required: ["questions"],
          },
        },
      ],
      function_call: { name: "createCodingMCQ" },
    })

    const functionCall = response.choices[0].message.function_call
    if (!functionCall) throw new Error("Function call failed")

    const result = JSON.parse(functionCall.arguments || '{}')

    if (!result.questions || !Array.isArray(result.questions)) {
      throw new Error('Invalid response format: questions array is missing.')
    }

    const quizzes: CodeChallenge[] = result.questions.map((q: any) => ({
      question: q.question,
      codeSnippet: q.codeSnippet || null,
      options: [q.answer, q.option1, q.option2, q.option3].map(option => option.replace(/^[A-D]\.\s*/, '').trim()),
      correctAnswer: q.answer.replace(/^[A-D]\.\s*/, '').trim(),
    }))

    return quizzes.map((q) => {
      if (q.codeSnippet && q.question.includes("```")) {
        throw new Error(`Code in question, should be in codeSnippet: ${q.question}`)
      }
      return q
    })
  } catch (error) {
    console.error("MCQ generation failed:", error)
    return []
  }
}