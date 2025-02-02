
import { CodeChallenge } from "@/app/types/types"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateCodingMCQs(
  language: string,
  subtopic: string,
  difficulty: string,
  questionCount: number = 2,
): Promise<CodeChallenge[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Generate ${questionCount} coding MCQs on ${subtopic} in ${language} at ${difficulty} level.
              Each MCQ must include:
              - A clear question without code snippets.
              - A code snippet in the "codeSnippet" field if needed for the question.
              - Four answer options without labels (A, B, C, D). Options may contain code snippets if necessary.
              - One correct answer.
              Ensure all code is properly formatted and indented. Use triple backticks (\`\`\`) to enclose code snippets in options.`
        },
      ],
      functions: [
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
                    codeSnippet: { type: "string" },
                    options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                    correctAnswer: { type: "string" },
                  },
                  required: ["question", "options", "correctAnswer"],
                },
                minItems: questionCount,
                maxItems: questionCount,
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

    return quizData.quizzes.map((q) => {
      if (q.codeSnippet && q.question.includes("```")) {
        throw new Error(`Code in question, should be in codeSnippet: ${q.question}`)
      }
      // Remove any A., B., C., D. labels from options
      if (Array.isArray(q.options)) {
        q.options = q.options.map(option => option.replace(/^[A-D]\.\s*/, '').trim())
      }
      if(q.correctAnswer){
        q.correctAnswer=q.correctAnswer.replace(/^[A-D]\.\s*/, '').trim();
      }
      return q
    })
  } catch (error) {
    console.error("MCQ generation failed:", error)
    return []
  }
}
