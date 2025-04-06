import { CodeChallenge } from "@/app/types/types";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateCodingMCQs(
  language: string,
  title: string,
  difficulty: string,
  amount:number
): Promise<CodeChallenge[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: [
        {
          role: "system",
          content: `Generate a coding quiz for ${language} on the topic of ${title} at a ${difficulty} difficulty level. 
          Each quiz question must have:
          1. A question that does not include any code.
          2. A 'codeSnippet' field containing the code relevant to the question.
          3. Four unlabeled answer options (without A, B, C, D labels).
          4. Only one correct answer.

          Requirements:
          - Programming language: ${language}
          - Difficulty level: ${difficulty}
          - Question: Must be clear and not contain any code.
          - Code snippet: Must contain relevant code that requires interpretation or analysis to answer the question. It MUST NOT directly reveal the answer.
          - Options: Provide four unlabeled answer options with only one correct answer.

          Steps:
          1. Define the topic language and difficulty level for the quiz.
          2. Create a clear title for the question without using any code.
          3. Develop a code snippet related to the question that requires interpretation and does not reveal the answer.
          4. Formulate four unlabeled answer options based on the code snippet, ensuring one of them is correct.
          5. Double-check that the correct answer isn't immediately obvious from the code snippet alone.
          
          Generate exactly ${amount} questions in this format.
          Ensure that 90% of the questions are coding-related and 10% are concept-related.For concept-related questions, do not include a 'codeSnippet'. Each question should provide four unlabeled answer options, with only one correct answer.
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
                    question: { type: "string" }, // Title for the question
                    codeSnippet: { type: "string" }, // Code snippet for the question
                    options: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 4,
                      maxItems: 4,
                    },
                    correctAnswer: { type: "string" }, // Correct answer
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
    });

    const functionCall = response.choices[0].message.function_call;
    if (!functionCall) throw new Error("Function call failed");

    const quizData: { quizzes: CodeChallenge[] } = JSON.parse(functionCall.arguments);

    return quizData.quizzes.map((q) => ({
      question: q.question, // Include the title field
      codeSnippet: q.codeSnippet,
      options: q.options,
      language: language,
      correctAnswer: q.correctAnswer,
    }));
  } catch (error) {
    console.error("MCQ generation failed:", error);
    return [];
  }
}