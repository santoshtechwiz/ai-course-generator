
import { MultipleChoiceQuestion } from "@/app/types/quiz-types"
import openai from "./openaiUtils"

interface FunctionDefinition {
  name: string
  description: string
  parameters: {
    type: string
    properties: {
      mcqs: {
        type: string
        items: {
          type: string
          properties: {
            question: { type: string }
            answer: { type: string }
            options: {
              type: string
              items: { type: string }
            }
          }
          required: string[]
        }
      }
    }
    required: string[]
  }
}

export default async function generateMultipleChoiceQuestions(
  courseTitle: string,
  transcript: string,
  numQuestions = 5,
  userType = "FREE",
): Promise<MultipleChoiceQuestion[]> {
  if (!courseTitle || !transcript) {
    throw new Error("Course title and transcript are required")
  }
  const model = userType === "FREE" || userType === "BASIC" ? "gpt-3.5-turbo-1106" : "GPT-4o mini"

  const functions: FunctionDefinition[] = [
    {
      name: "formatMCQs",
      description:
        "Generates multiple-choice questions for a course transcript, each with 4 options (1 correct, 3 incorrect).",
      parameters: {
        type: "object",
        properties: {
          mcqs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                answer: { type: "string" },
                options: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["question", "answer", "options"],
            },
          },
        },
        required: ["mcqs"],
      },
    },
  ]
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { 
          role: "system", 
          content: "You are an expert in creating educational multiple-choice questions. Focus only on important concepts, key facts, and core knowledge presented in the content. Ignore introductions, speaker information, greetings, conclusions, and any meta-content about the video or course itself."
        },
        {
          role: "user",
          content: `Generate a maximum of ${numQuestions} multiple-choice questions based on the course titled "${courseTitle}" using the following transcript: ${transcript}. 

Requirements:
- Focus ONLY on substantive educational content and core concepts
- Each question must have one correct answer and three plausible but incorrect options
- Avoid any questions about who created the content, introductions, or video metadata
- Questions should test understanding of key concepts, not trivial details
- Ensure questions cover different aspects of the main topic
- Make options distinct and unambiguous (avoid "all of the above" type options)`,
        },
      ],
      functions,
      function_call: { name: "formatMCQs" },
      temperature: 0.5, // Lower temperature for more focused content
    })

    const result = response?.choices[0]?.message?.function_call?.arguments
    if (!result) {
      throw new Error("No result returned from OpenAI")
    }
    return JSON.parse(result).mcqs
  } catch (error) {
    console.error("Error generating MCQs:", error)
    throw new Error("Failed to generate MCQs")
  }
}
