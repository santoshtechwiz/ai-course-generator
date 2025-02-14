
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
      model: "gpt-3.5-turbo-1106",
      messages: [
        {
          role: "system",
          content: `Generate precisely ${questionCount} multiple-choice coding questions on ${subtopic} in ${language} at a ${difficulty} level.
    
          **Output Format:**
          Each question must follow this JSON structure:
          {
            "question": "A concise coding-related question.",
            "codeSnippet": "Python/JavaScript/etc. code snippet if needed, else empty string.",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": "Exact text matching one of the options."
          }
          
          **Rules:**
          - Each question must be **strictly about coding** (90% must include code snippets).
          - Ensure **options are unique, meaningful, and well-formatted** (no duplicates).
          - **Do not include code inside 'question'**; use 'codeSnippet' instead.
          - The 'correctAnswer' **must exactly match one of the options**.
          - Do NOT add prefixes (A., B., C., D.) to options.
          - Ensure **consistent formatting** across all responses.
          `
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
    });
    

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
