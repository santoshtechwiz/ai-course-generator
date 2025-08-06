import type { CodeChallenge } from "@/app/types/types";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateCodingMCQs(
  language: string,
  title: string,
  difficulty: string,
  amount: number
): Promise<CodeChallenge[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview", // or "gpt-3.5-turbo-1106"
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates multiple-choice coding questions in structured JSON format.`,
        },
        {
          role: "user",
          content: `
Generate ${amount} multiple-choice coding questions for the language: ${language}, on the topic: ${title}, with difficulty: ${difficulty}. 

Rules:
- 70% should be standard code interpretation questions.
- 20% should be fill-in-the-blank code syntax questions (e.g. missing keyword, operator, or expression). Use '____' or '/* blank */' in the code.
- 10% should be concept-based questions with no codeSnippet (set codeSnippet: null).

Each question must have:
{
  "question": string,                   // No code in this field
  "codeSnippet": string | null,        // Can contain blanks for fill-in-the-blank
  "options": [string, string, string, string], // Four options
  "correctAnswer": string,             // Must match one of the options
  "questionType": "standard" | "fill-in-the-blank"
}
Return an array named 'quizzes'.
Ensure there is only one correct answer per question.
        `,
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
                    codeSnippet: { type: ["string", "null"] },
                    options: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 4,
                      maxItems: 4,
                    },
                    correctAnswer: { type: "string" },
                    questionType: {
                      type: "string",
                      enum: ["standard", "fill-in-the-blank"],
                    },
                  },
                  required: [
                    "question",
                    "codeSnippet",
                    "options",
                    "correctAnswer",
                    "questionType",
                    
                  ],
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
    });

    const functionCall = response.choices[0].message.function_call;
    if (!functionCall || !functionCall.arguments) {
      throw new Error("Function call failed or arguments missing.");
    }

    const parsed = JSON.parse(functionCall.arguments) as {
      quizzes: CodeChallenge[];
    };

    return parsed.quizzes.map((q) => ({
      question: q.question,
      codeSnippet: q.codeSnippet,
      options: q.options,
      correctAnswer: q.correctAnswer,
      language: language,
      questionType: q.questionType,
    }));
  } catch (error) {
    console.error("MCQ generation failed:", error);
    return [];
  }
}
