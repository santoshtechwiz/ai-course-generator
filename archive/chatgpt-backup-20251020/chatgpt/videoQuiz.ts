
import { MultipleChoiceQuestion } from "@/app/types/quiz-types"
import openai from "./openaiUtils"

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
      tools: [{
        type: "function",
        function: {
          name: "formatMCQs",
          description: "Generates multiple-choice questions for a course transcript, each with 4 options (1 correct, 3 incorrect).",
          parameters: {
            type: "object",
            properties: {
              mcqs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string", description: "The question text" },
                    answer: { type: "string", description: "The correct answer" },
                    options: {
                      type: "array",
                      description: "Array of 4 possible answers",
                      items: { type: "string" },
                      minItems: 4,
                      maxItems: 4
                    }
                  },
                  required: ["question", "answer", "options"]
                }
              }
            },
            required: ["mcqs"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "formatMCQs" } },
      temperature: 0.5
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== 'function' || !toolCall.function.arguments) {
      throw new Error("No valid tool call returned from OpenAI")
    }
    
    return JSON.parse(toolCall.function.arguments).mcqs
  } catch (error) {
    console.error("Error generating MCQs:", error)
    throw new Error("Failed to generate MCQs")
  }
}
