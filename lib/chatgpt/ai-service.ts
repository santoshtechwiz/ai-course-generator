import OpenAI from "openai";

import { FlashCard } from "@/app/types/types";
import openai from "./openaiUtils";


export async function generateFlashCards(
  topic: string,
  count = 5
): Promise<FlashCard[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI that generates structured flashcards."
        },
        {
          role: "user",
          content: `Generate ${count} flash cards about "${topic}".
          Each flashcard should have a challenging question and a concise yet comprehensive answer.
          
          Respond as a function call using the "generate_flashcards" function schema.`
        }
      ],
      functions: [
        {
          name: "generate_flashcards",
          description: "Generates a list of flashcards with questions and answers.",
          parameters: {
            type: "object",
            properties: {
              flashcards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" }
                  },
                  required: ["question", "answer"]
                }
              }
            },
            required: ["flashcards"]
          }
        }
      ],
      function_call: "auto"
    });

    const functionCall = response.choices[0]?.message?.function_call;
    if (!functionCall || functionCall.name !== "generate_flashcards") {
      throw new Error("Function call not received from API.");
    }

    const parsedResponse = JSON.parse(functionCall.arguments);
    if (!Array.isArray(parsedResponse.flashcards)) {
      throw new Error("Invalid API response format");
    }

    return parsedResponse.flashcards.map((item) => ({
      question: item.question,
      answer: item.answer
    }));
  } catch (error) {
    console.error("Error generating flash cards:", error);
    throw new Error("Failed to generate flash cards");
  }
}
