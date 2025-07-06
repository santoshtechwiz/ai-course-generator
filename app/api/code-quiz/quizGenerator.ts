import type { CodeChallenge } from "@/app/types/types"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateCodingMCQs(
  language: string,
  title: string,
  difficulty: string,
  amount: number,
): Promise<CodeChallenge[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: [
        {
          role: "system",          content: `Create ${amount} ${language} coding quiz questions on ${title} (${difficulty} level).

          RULES:
          1. Use "______" or "???" placeholders in code - NEVER reveal answers
          2. 80% code completion, 10% code analysis, 10% concept-only

          FORMATS:
          
          Code Completion:
          Q: "What completes this function?"
          Code: "function add(a, b) {\n  return a ______ b;\n}"
          Options: ["+", "-", "*", "/"]

          Code Analysis: 
          Q: "What's the output?"
          Code: "console.log([1,2,3].length);"
          Options: ["3", "2", "undefined", "error"]

          Concept (no code):
          Q: "Which is fastest?"
          Code: ""
          Options: ["Array.find", "for loop", "forEach", "map"]

          Generate practical, realistic questions with clear correct answers.`,
        },
      ],      functions: [
        {
          name: "create_coding_mcqs",
          parameters: {
            type: "object",
            properties: {
              quizzes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    codeSnippet: { 
                      type: "string",
                      description: "Code with placeholders (______) or empty string for concept questions"
                    },
                    options: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 4,
                      maxItems: 4,
                    },
                    correctAnswer: { type: "string" },
                  },
                  required: ["question", "codeSnippet", "options", "correctAnswer"],
                },
                minItems: amount,
                maxItems: amount,
              },
            },
            required: ["quizzes"],
          },
        },
      ],
      function_call: { name: "create_coding_mcqs" },
    })

    const functionCall = response.choices[0].message.function_call
    if (!functionCall) throw new Error("Function call failed")

    const quizData: { quizzes: CodeChallenge[] } = JSON.parse(functionCall.arguments)

    return quizData.quizzes.map((q) => ({
      question: q.question,
      codeSnippet: q.codeSnippet || "", // Handle concept questions without code
      options: q.options,
      language: language,
      correctAnswer: q.correctAnswer,
    }))
  } catch (error) {
    console.error("MCQ generation failed:", error)
    return []
  }
}
