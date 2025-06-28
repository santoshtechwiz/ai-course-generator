import type { OpenAIMessage, Quiz } from "@/app/types/types"

import openai, { generateQuizFlexible } from "./openaiUtils"
import { getAIModel } from "../utils";



export const generateMcqForUserInput = async (title: string, amount: number, difficulty = "hard", userType: string) => {
  const model = getAIModel(userType);
  const functions = [
    {
      name: "createMCQ",
      description: "Create multiple MCQ questions",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                answer: { type: "string", description: "Correct answer, max 15 words" },
                option1: { type: "string", description: "Incorrect option, max 15 words" },
                option2: { type: "string", description: "Incorrect option, max 15 words" },
                option3: { type: "string", description: "Incorrect option, max 15 words" },
              },
              required: ["question", "answer", "option1", "option2", "option3"],
            },
          },
        },
        required: ["questions"],
      },
    },
  ]

  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: "You are an AI that generates multiple-choice questions." },
      {
        role: "user",
        content: `Generate ${amount} ${difficulty} multiple-choice questions about ${title}. Each question should have one correct answer and three incorrect options.`,
      },
    ],
    functions,
    function_call: { name: "createMCQ" },
  })

  const result = JSON.parse(response.choices[0].message?.function_call?.arguments || "{}")

  if (!result.questions || !Array.isArray(result.questions)) {
    throw new Error("Invalid response format: questions array is missing.")
  }

  return result.questions
}

export const generateOpenEndedQuiz = async (
  title: string,
  amount = 5,
  difficulty = "medium",
  userType = "FREE",
): Promise<Quiz> => {
   const model = getAIModel(userType);
  const functions = [
    {
      name: "createOpenEndedQuiz",
      description: "Create a concise open-ended quiz based on a given topic",
      parameters: {
        type: "object",
        properties: {
          quiz_title: { type: "string" },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: {
                  type: "string",
                  description: "A brief, clear question (max 15 words)",
                },
                correct_answer: {
                  type: "string",
                  description: "A concise answer (max 5 words)",
                },
                hints: {
                  type: "array",
                  items: {
                    type: "string",
                    description: "Short hint (max 8 words)",
                  },
                  description: "Two brief hints for the question",
                },
                difficulty: {
                  type: "string",
                  enum: ["Easy", "Medium", "Hard"],
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Two relevant tags for the question",
                },
              },
              required: ["question", "correct_answer", "hints", "difficulty", "tags"],
            },
          },
        },
        required: ["quiz_title", "questions"],
      },
    },
  ]

  const messages: OpenAIMessage[] = [
    {
      role: "system",
      content:
        "You are an AI that generates concise, engaging open-ended quizzes. Create short questions with brief, easy-to-type answers. Focus on key concepts and avoid overly complex language. Aim for questions that can be answered in a few words.",
    },
    {
      role: "user",
      content: `Generate a concise open-ended quiz about ${title} with ${amount} questions. The quiz should have a short title. Each question should be brief (max 150 words) with a concise answer (max 200 words), two short hints (max 8 words each), a difficulty level (Easy, Medium, or Hard), and two relevant tags. Ensure a mix of difficulties across the questions. Prioritize questions that can be answered with a single word or a very short phrase.`,
    },
  ]

  return generateQuizFlexible({
    model,
    messages,
    functions,
    functionCall: { name: "createOpenEndedQuiz" },
  })
}

export const generateOpenEndedFillIntheBlanks = async (
  title: string,
  amount: number,
  userType = "FREE",
): Promise<Quiz> => {
  const model = getAIModel(userType);

  const functions = [
    {
      name: "createBlankQuiz",
      description: "Generate a fill-in-the-blanks quiz with multiple questions.",
      parameters: {
        type: "object",
        properties: {
          quiz_title: { type: "string", description: "Title of the quiz" },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string", description: "A sentence with a blank for the answer" },
                correct_answer: { type: "string", description: "Correct answer for the blank" },
                hints: {
                  type: "array",
                  items: { type: "string" },
                  description: "Two hints to help answer the question",
                },
                difficulty: {
                  type: "string",
                  description: "Difficulty level (easy, medium, hard)",
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tags related to the question",
                },
              },
              required: ["question", "correct_answer", "hints", "difficulty", "tags"],
            },
          },
        },
        required: ["quiz_title", "questions"],
      },
    },
  ]
  const messages: OpenAIMessage[] = [
    {
      role: "system",
      content:
        "You are an AI that generates fill-in-the-blanks type quizzes with multiple questions, hints, difficulty levels, and tags.",
    },
    {
      role: "user",
      content: `Generate a quiz on ${title} with ${amount} fill-in-the-blank questions.`,
    },
  ]

  return generateQuizFlexible({
    model,
    messages,
    functions,
    functionCall: { name: "createBlankQuiz" },
  })
}
