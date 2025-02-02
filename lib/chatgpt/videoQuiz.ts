import { MultipleChoiceQuestion } from "@/app/types/types";
import { openai } from "./gpt";

interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: {
      mcqs: {
        type: string;
        items: {
          type: string;
          properties: {
            question: { type: string };
            answer: { type: string };
            options: {
              type: string;
              items: { type: string };
            };
          };
          required: string[];
        };
      };
    };
    required: string[];
  };
}

export default async function generateMultipleChoiceQuestions(
  courseTitle: string,
  transcript: string,
  numQuestions: number = 5,
  userType: string = "FREE"
): Promise<MultipleChoiceQuestion[]> {
  if (!courseTitle || !transcript) {
    throw new Error("Course title and transcript are required");
  }
  const model = userType === "FREE" || userType === "BASIC" ? "gpt-3.5-turbo-1106" : "GPT-4o mini";

  const functions: FunctionDefinition[] = [
    {
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
  ];

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: "You are an expert in creating multiple-choice questions." },
        {
          role: "user",
          content: `Generate a maximum of ${numQuestions} multiple-choice questions based on the course titled "${courseTitle}" using the following transcript: ${transcript}. Each question must have one correct answer and three incorrect options. Please avoid generating questions on the author's introduction or irrelevant content and stick strictly to the main topic of the course.`,
        },
      ],
      functions,
      function_call: { name: "formatMCQs" },
    });

    const result = response?.choices[0]?.message?.function_call?.arguments;
    if (!result) {
      throw new Error("No result returned from OpenAI");
    }
    return JSON.parse(result).mcqs;
  } catch (error) {
    console.error("Error generating MCQs:", error);
    throw new Error("Failed to generate MCQs");
  }
}
