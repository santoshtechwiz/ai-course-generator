import { MultipleChoiceQuestion } from "@/app/types";
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

export async function generateMultipeChoiceQuestionForVideo(
  courseTitle: string,
  transcript: string,
  numQuestions: number = 5
): Promise<MultipleChoiceQuestion[]> {
  if (!courseTitle || !transcript) {
    throw new Error("Course title and transcript are required");
  }

  const functions: FunctionDefinition[] = [
    {
      name: "formatMCQs",
      description: "Formats multiple-choice questions with answers and options for a course.",
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
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert in creating multiple-choice questions." },
        {
          role: "user",
          content: `Generate ${numQuestions} multiple-choice questions for the course titled "${courseTitle}" based on the following transcript: ${transcript}. Each question should have one correct answer and three incorrect options.`,
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
