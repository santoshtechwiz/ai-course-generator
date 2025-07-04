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
      description: "Create comprehensive open-ended quiz questions that require detailed answers",
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
                  description: "A thoughtful, detailed question that requires comprehensive explanation (50-100 words)",
                },
                correct_answer: {
                  type: "string",
                  description: "A comprehensive model answer that demonstrates depth of knowledge (100-300 words)",
                },
                hints: {
                  type: "array",
                  items: {
                    type: "string",
                    description: "Substantive hints that guide thinking without giving away the answer (15-25 words each)",
                  },
                  description: "Two detailed hints for the question",
                },
                difficulty: {
                  type: "string",
                  enum: ["Easy", "Medium", "Hard"],
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-4 relevant tags that categorize the knowledge domains of the question",
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
        "You are an expert educator who creates thought-provoking, in-depth open-ended quiz questions. Craft comprehensive questions that require critical thinking, analysis, and detailed explanations. Design questions that encourage learners to demonstrate their understanding through thorough responses rather than simple one-word answers.",
    },
    {
      role: "user",
      content: `Generate an in-depth open-ended quiz about "${title}" with ${amount} questions. 

The quiz should have a descriptive title. For each question:
1. Create a substantive question (50-100 words) that requires critical thinking and detailed explanation
2. Provide a comprehensive model answer (100-300 words) that demonstrates depth of knowledge and proper reasoning
3. Include two meaningful hints (15-25 words each) that guide thinking without giving away the answer
4. Assign an appropriate difficulty level (Easy, Medium, or Hard)
5. Add 3-4 relevant tags that categorize the knowledge domains covered by the question

Ensure a balanced mix of difficulties based on the requested level (${difficulty}). Questions should encourage analytical thinking, explanations of concepts, comparisons, evaluations, or applications of knowledge.`,
    },
  ]  // Process the response to standardize field names
  const rawQuiz = await generateQuizFlexible({
    model,
    messages,
    functions,
    functionCall: { name: "createOpenEndedQuiz" },
  })

  // Transform the response to ensure consistency with expected schema
  if (rawQuiz && Array.isArray(rawQuiz.questions)) {
    // Map correct_answer to answer if needed
    rawQuiz.questions = rawQuiz.questions.map(question => {
      const q = question as any; // Use any to handle potential field name variations
      return {
        ...q,
        // Ensure the answer field is populated, preferring answer but falling back to correct_answer
        answer: q.answer || q.correct_answer || "",
      };
    });
  }

  return rawQuiz
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
