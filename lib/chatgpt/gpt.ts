import { OpenAI } from "openai";
import https from "https";
import { z } from "zod";


import { generateMcqForUserInput } from "./userMcqQuiz";

import { getQuestionsSchema } from "@/schema/schema";
import { generateOpenEndedQuiz } from "./quizGenerator";
import { Question } from "@/app/types/types";
import { set } from "lodash";
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
    const { amount, topic, type,difficulty,userType } = getQuestionsSchema.parse(req);

    console.log(`Generating ${amount} ${type} questions about ${topic}`);

    //Similuate quiz generation
  const questions: Question[] = [];
  for (let i = 0; i < amount; i++) {
    questions.push({
      id: i + 1,
      question: `What is ${i + 1} + ${i + 2}?`,
      answer: `${i + 1 + i + 2}`,
      option1: `${i + 1}`,
      option2: `${i + 2}`,
      option3: `${i + 3}`,
    });
  }
    //resolve promise after 10 seconds

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ questions });
      }, 10000);
    });
    


    // Generate questions based on the type
    // const questions = type === 'mcq'
    //   ? await generateMcqForUserInput(topic, amount, difficulty, userType || '')
    //   : await generateOpenEndedQuiz(topic, amount,userType);

   
    // return  questions ;
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map((i) => i.message).join(', ')}`);
    }
    // Re-throw other errors
    throw error;
  }
}