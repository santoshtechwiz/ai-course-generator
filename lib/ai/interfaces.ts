/**
 * Common interfaces for working with AI/LLM providers
 */

import { Quiz } from "@/app/types/types";
import { ChatCompletionMessageParam } from "openai/resources";

/**
 * Represents a message in a conversation with an AI model
 */
export interface AIMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
}

/**
 * Maps our AIMessage to OpenAI's message format
 */
export function mapToOpenAIMessage(message: AIMessage): ChatCompletionMessageParam {
  // For function messages, name is required by OpenAI
  if (message.role === 'function' && !message.name) {
    throw new Error("Function messages must have a name");
  }
  
  return message as ChatCompletionMessageParam;
}

/**
 * Represents a function that can be called by the AI model
 */
export interface AIFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * Parameters for generating a chat completion
 */
export interface ChatCompletionParams {
  model: string;
  messages: AIMessage[];
  functions?: AIFunction[];
  functionCall?: { name: string } | "auto" | "none";
  temperature?: number;
  maxTokens?: number;
}

/**
 * The result of a chat completion
 */
export interface ChatCompletionResult {
  content?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Parameters for quiz generation
 */
export interface QuizGenerationParams {
  title: string;
  amount: number;
  difficulty?: string;
  userType?: string;
  type?: string;
}

/**
 * Interface for AI providers
 */
export interface AIProvider {
  /**
   * Generate a chat completion
   */
  generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult>;

  /**
   * Generate multiple choice questions
   */
  generateMCQQuiz(params: QuizGenerationParams): Promise<any[]>;

  /**
   * Generate open-ended questions
   */
  generateOpenEndedQuiz(params: QuizGenerationParams): Promise<Quiz>;

  /**
   * Generate fill-in-the-blanks questions
   */
  generateFillInTheBlanksQuiz(params: QuizGenerationParams): Promise<Quiz>;
}
