import {
  AIProvider,
  ChatCompletionParams,
  ChatCompletionResult,
  QuizGenerationParams,
  AIMessage,
} from "../interfaces";
import { Quiz } from "@/app/types/types";

/**
 * Google AI provider implementation using Gemini API
 * 
 * Integrates with Google's Generative AI (Gemini) models
 * to provide AI-powered quiz generation and chat completion.
 * 
 * @see https://ai.google.dev/docs
 */
export class GoogleAIProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor(apiKey: string = process.env.GOOGLE_AI_API_KEY || "") {
    if (!apiKey) {
      console.warn('Google AI API key not provided. GoogleAIProvider will fail at runtime.');
    }
    this.apiKey = apiKey;
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    this.defaultModel = "gemini-pro"; // Default to Gemini Pro
  }

  /**
   * Convert our AIMessage format to Google AI format
   */
  private mapToGeminiMessage(message: AIMessage): { role: string; parts: { text: string }[] } {
    // Google AI uses 'user' and 'model' roles, map our roles accordingly
    const role = message.role === 'assistant' ? 'model' : 'user';
    const content = message.role === 'system' 
      ? `[System Instructions] ${message.content}` // Prepend system messages
      : message.content;

    return {
      role,
      parts: [{ text: content }],
    };
  }

  /**
   * Generate a chat completion using Google Gemini API
   */
  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult> {
    try {
      // Map model name to Google AI model
      const model = this.mapModelName(params.model);
      
      // Convert messages to Gemini format
      const geminiMessages = params.messages.map(msg => this.mapToGeminiMessage(msg));

      // Separate system messages from conversation
      const systemMessages = params.messages
        .filter(msg => msg.role === 'system')
        .map(msg => msg.content)
        .join('\n\n');

      const userMessages = geminiMessages.filter(msg => msg.role === 'user' || msg.role === 'model');

      const requestBody = {
        contents: userMessages,
        systemInstruction: systemMessages ? { parts: [{ text: systemMessages }] } : undefined,
        generationConfig: {
          temperature: params.temperature || 0.7,
          maxOutputTokens: params.maxTokens || 2048,
          topP: 0.8,
          topK: 40,
        },
      };

      const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google AI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const usage = data.usageMetadata;

      return {
        content: content || undefined,
        usage: usage ? {
          promptTokens: usage.promptTokenCount || 0,
          completionTokens: usage.candidatesTokenCount || 0,
          totalTokens: usage.totalTokenCount || 0,
        } : undefined,
      };
    } catch (error) {
      console.error('[GoogleAIProvider] Chat completion error:', error);
      throw error;
    }
  }

  /**
   * Map generic model names to Google AI model names
   */
  private mapModelName(model: string): string {
    const modelMap: Record<string, string> = {
      'gpt-3.5-turbo': 'gemini-pro',
      'gpt-4': 'gemini-pro',
      'gpt-4-turbo': 'gemini-1.5-pro',
      'gemini-pro': 'gemini-pro',
      'gemini-1.5-pro': 'gemini-1.5-pro',
      'gemini-1.5-flash': 'gemini-1.5-flash',
    };

    return modelMap[model] || this.defaultModel;
  }

  /**
   * Generate multiple choice questions using Google AI
   */
  async generateMCQQuiz(params: QuizGenerationParams): Promise<any[]> {
    const { title, amount, difficulty = "medium" } = params;

    const prompt = `Generate ${amount} ${difficulty} multiple-choice questions about "${title}".

For each question, provide:
1. A clear question
2. One correct answer (max 15 words)
3. Three incorrect but plausible options (max 15 words each)

Return ONLY a JSON array with this exact structure:
[
  {
    "question": "...",
    "answer": "...",
    "option1": "...",
    "option2": "...",
    "option3": "..."
  }
]`;

    const result = await this.generateChatCompletion({
      model: "gemini-pro",
      messages: [
        { role: "system", content: "You are an AI that generates educational multiple-choice questions. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 2048,
    });

    if (!result.content) {
      throw new Error("No content generated");
    }

    // Parse JSON response
    const jsonMatch = result.content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse MCQ questions from response");
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Generate open-ended questions using Google AI
   */
  async generateOpenEndedQuiz(params: QuizGenerationParams): Promise<Quiz> {
    const { title, amount, difficulty = "medium" } = params;

    const prompt = `Generate ${amount} ${difficulty} open-ended essay questions about "${title}".

Each question should:
- Require detailed, thoughtful answers (2-3 paragraphs)
- Test critical thinking and understanding
- Be clear and specific

Return ONLY a JSON object with this structure:
{
  "questions": [
    {
      "question": "...",
      "sampleAnswer": "..."
    }
  ]
}`;

    const result = await this.generateChatCompletion({
      model: "gemini-pro",
      messages: [
        { role: "system", content: "You are an AI that generates educational questions. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 2048,
    });

    if (!result.content) {
      throw new Error("No content generated");
    }

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse open-ended questions from response");
    }

    const data = JSON.parse(jsonMatch[0]);

    return {
      id: Date.now().toString(),
      title,
      questions: data.questions || [],
    };
  }

  /**
   * Generate fill-in-the-blanks questions using Google AI
   */
  async generateFillInTheBlanksQuiz(params: QuizGenerationParams): Promise<Quiz> {
    const { title, amount } = params;

    const prompt = `Generate ${amount} fill-in-the-blanks questions about "${title}".

Each question should:
- Have a sentence with ONE blank (marked as _____)
- Provide the correct answer to fill the blank

Return ONLY a JSON object with this structure:
{
  "questions": [
    {
      "question": "The capital of France is _____.",
      "answer": "Paris"
    }
  ]
}`;

    const result = await this.generateChatCompletion({
      model: "gemini-pro",
      messages: [
        { role: "system", content: "You are an AI that generates educational fill-in-the-blank questions. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 2048,
    });

    if (!result.content) {
      throw new Error("No content generated");
    }

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse fill-in-the-blanks questions from response");
    }

    const data = JSON.parse(jsonMatch[0]);

    return {
      id: Date.now().toString(),
      title,
      questions: data.questions || [],
    };
  }
}

