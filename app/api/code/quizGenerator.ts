import type { CodeChallenge } from "@/app/types"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateCodingMCQs(
  language: string,
  subtopic: string,
  difficulty: string,
  questionCount = 2,
  userType: "FREE" | "BASIC" | "PREMIUM" = "FREE",
): Promise<CodeChallenge[]> {
  try {
    const model = userType === "PREMIUM" ? "gpt-4" : "gpt-3.5-turbo-1106"
    const codingQuestionCount = Math.ceil(questionCount * 0.9)

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are an AI that generates multiple-choice coding questions. Ensure that only code snippets are wrapped in triple backticks (\`\`\`). The rest of the text (questions, answers, and options) should be plain text. The code snippet should be included in the 'codeSnippet' field and not duplicated in the 'question' field.`,
        },
        {
          role: "user",
          content: `Generate ${questionCount} ${difficulty} multiple-choice questions about ${language} ${subtopic}. 
          Include at least ${codingQuestionCount} coding problems.`,
        },
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
                    codeSnippet: { type: "string", description: "Code snippet wrapped in triple backticks (\`\`\`)" },
                    answer: { type: "string", description: "Correct answer, wrapped in triple backticks (\`\`\`) if it's code" },
                    options: {
                      type: "array",
                      items: { type: "string", description: "Incorrect options, wrapped in triple backticks (\`\`\`) if they are code" },
                      minItems: 3,
                      maxItems: 3,
                    },
                  },
                  required: ["question", "answer", "options"],
                },
                minItems: questionCount, // Ensure exactly `questionCount` questions
                maxItems: questionCount,
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

    const result = JSON.parse(functionCall.arguments || "{}")

    if (!result.questions || !Array.isArray(result.questions)) {
      throw new Error("Invalid response format: questions array is missing.")
    }

    const quizzes: CodeChallenge[] = result.questions.map((q: any) => {
      // Ensure the correct answer is not already in the options
      const uniqueOptions = q.options.filter((option: string) => option !== q.answer)
      // Add the correct answer to the options array
      const options = [...uniqueOptions, q.answer]
      // Shuffle the options to randomize the correct answer's position
      const shuffledOptions = shuffleArray(options)

      return {
        question: removeCodeFromQuestion(q.question),
        codeSnippet: q.codeSnippet || null,
        options: shuffledOptions,
        correctAnswer: q.answer
      }
    })

    return quizzes
  } catch (error) {
    console.error("MCQ generation failed:", error)
    return []
  }
}

// Helper function to shuffle an array
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}
function removeCodeFromQuestion(question:string){
  return question.replace(/```/g, '')

}