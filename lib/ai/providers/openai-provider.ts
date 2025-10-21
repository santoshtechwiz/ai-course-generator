import { OpenAI } from "openai";
import https from "https";
import {
  AIProvider,
  ChatCompletionParams,
  ChatCompletionResult,
  QuizGenerationParams,
  mapToOpenAIMessage
} from "../interfaces";
import { Quiz } from "@/app/types/types";
import { getAIProviderConfig } from "../config/config";

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string = process.env.OPENAI_API_KEY || "") {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    this.client = new OpenAI({
      apiKey: apiKey,
      httpAgent: agent,
      // dangerouslyAllowBrowser: true, // Removed for server-side use
    });
  }

  /**
   * Generate a chat completion using OpenAI
   */
  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult> {
    const response = await this.client.chat.completions.create({
      model: params.model,
      messages: params.messages.map(mapToOpenAIMessage),
      functions: params.functions,
      function_call: params.functionCall,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
    });

    const message = response.choices[0].message;

    if (message.function_call) {
      return {
        functionCall: {
          name: message.function_call.name,
          arguments: message.function_call.arguments || "{}",
        },
      };
    }

    return {
      content: message.content || undefined,
    };
  }

  /**
   * Generate multiple choice questions using OpenAI
   */
  async generateMCQQuiz(params: QuizGenerationParams): Promise<any[]> {
    const { title, amount, difficulty = "medium", userType = "FREE" } = params;
    
    const model = this.getAIModel(userType);
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
    ];

    const result = await this.generateChatCompletion({
      model,
      messages: [
        { role: "system", content: "You are an AI that generates multiple-choice questions." },
        {
          role: "user",
          content: `Generate ${amount} ${difficulty} multiple-choice questions about ${title}. Each question should have one correct answer and three incorrect options.`,
        },
      ],
      functions,
      functionCall: { name: "createMCQ" },
    });

    if (!result.functionCall?.arguments) {
      throw new Error("Failed to generate MCQ quiz");
    }

    const parsedResult = JSON.parse(result.functionCall.arguments);

    if (!parsedResult.questions || !Array.isArray(parsedResult.questions)) {
      throw new Error("Invalid response format: questions array is missing.");
    }

    return parsedResult.questions;
  }

  /**
   * Generate open-ended questions using OpenAI
   */
  async generateOpenEndedQuiz(params: QuizGenerationParams): Promise<Quiz> {
    const { title, amount, difficulty = "medium", userType = "FREE" } = params;
    
    const model = this.getAIModel(userType);
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
    ];

    const result = await this.generateChatCompletion({
      model,
      messages: [
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
      ],
      functions,
      functionCall: { name: "createOpenEndedQuiz" },
    });

    if (!result.functionCall?.arguments) {
      throw new Error("Failed to generate open-ended quiz");
    }

    const parsedResult = JSON.parse(result.functionCall.arguments);

    if (!parsedResult.quiz_title || !parsedResult.questions || !Array.isArray(parsedResult.questions)) {
      throw new Error("Invalid response format: quiz_title or questions array is missing.");
    }    // Transform to ensure consistency
    if (Array.isArray(parsedResult.questions)) {
      // Map correct_answer to answer if needed
      parsedResult.questions = parsedResult.questions.map((question: Record<string, any>) => {
        return {
          ...question,
          // Ensure the answer field is populated, preferring answer but falling back to correct_answer
          answer: question.answer || question.correct_answer || "",
        };
      });
    }

    return parsedResult as Quiz;
  }

  /**
   * Generate fill-in-the-blanks questions using OpenAI
   */
  async generateFillInTheBlanksQuiz(params: QuizGenerationParams): Promise<Quiz> {
    const { title, amount, userType = "FREE" } = params;
    
    const model = this.getAIModel(userType);
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
    ];

    const result = await this.generateChatCompletion({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an AI that generates fill-in-the-blanks type quizzes with multiple questions, hints, difficulty levels, and tags.",
        },
        {
          role: "user",
          content: `Generate a quiz on ${title} with ${amount} fill-in-the-blank questions.`,
        },
      ],
      functions,
      functionCall: { name: "createBlankQuiz" },
    });

    if (!result.functionCall?.arguments) {
      throw new Error("Failed to generate fill-in-the-blanks quiz");
    }

    const parsedResult = JSON.parse(result.functionCall.arguments);

    if (!parsedResult.quiz_title || !parsedResult.questions || !Array.isArray(parsedResult.questions)) {
      throw new Error("Invalid response format: quiz_title or questions array is missing.");
    }    // Transform to ensure consistency
    if (Array.isArray(parsedResult.questions)) {
      // Map correct_answer to answer if needed
      parsedResult.questions = parsedResult.questions.map((question: Record<string, any>) => {
        return {
          ...question,
          answer: question.answer || question.correct_answer || "",
        };
      });
    }

    return parsedResult as Quiz;
  }

  /**
   * Get the appropriate AI model based on user type
   */
  private getAIModel(userType: string): string {
    const config = getAIProviderConfig();
    
    // Use configuration or fallback to defaults
    switch (userType) {
      case "FREE":
        return config.models.FREE || "gpt-3.5-turbo-1106";
      case "BASIC":
        return config.models.BASIC || "gpt-3.5-turbo-1106";
      case "PREMIUM":
        return config.models.PREMIUM || "gpt-4-1106-preview";
      case "ULTIMATE":
        return config.models.ULTIMATE || "gpt-4-1106-preview";
      default:
        return config.models.FREE || "gpt-3.5-turbo-1106";
    }
  }
}
