import { OpenAI } from "openai";
import https from "https";
import { z } from "zod";

import { Question } from "./Question";
import { generateMcqForUserInput } from "./userMcqQuiz";
import { generateOpenEnded } from "./generateOpenEnded";
import { getQuestionsSchema } from "@/schema/schema";
const agent = new https.Agent({  
  rejectUnauthorized: false
});
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  httpAgent: agent,
  dangerouslyAllowBrowser: true
});

export async function generateQuestions(req: unknown): Promise<{ questions: Question[] }> {
  try {
    // Validate the input using Zod
    const { amount, topic, type,difficulty } = getQuestionsSchema.parse(req);

    console.log(`Generating ${amount} ${type} questions about ${topic}`);

    // Generate questions based on the type
    const questions = type === 'mcq'
      ? await generateMcqForUserInput(topic, amount,difficulty)
      : await generateOpenEnded(topic, amount);

   
    return  questions ;
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map((i) => i.message).join(', ')}`);
    }
    // Re-throw other errors
    throw error;
  }
}