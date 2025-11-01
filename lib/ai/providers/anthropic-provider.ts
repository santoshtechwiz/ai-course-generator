import {
  AIProvider,
  ChatCompletionParams,
  ChatCompletionResult,
  QuizGenerationParams,
  AIMessage,
} from "../interfaces";
import { Quiz } from "@/app/types/types";
import { env } from "@/lib/env";

/**
 * Anthropic AI provider implementation using Claude API
 *
 * Integrates with Anthropic's Claude models to provide AI-powered
 * quiz generation and chat completion.
 *
 * @see https://docs.anthropic.com/claude/reference
 */
export class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private apiVersion: string;

  constructor(apiKey: string = env.ANTHROPIC_API_KEY || "") {
    if (!apiKey) {
      console.warn('Anthropic API key not provided. AnthropicProvider will fail at runtime.');
    }
    this.apiKey = apiKey;
    this.baseUrl = "https://api.anthropic.com/v1";
    this.defaultModel = "claude-3-sonnet-20240229"; // Claude 3 Sonnet
    this.apiVersion = "2023-06-01";
  }

  /**
   * Convert our AIMessage format to Anthropic format
   */
  private mapToClaudeMessages(messages: AIMessage[]): {
    system?: string;
    messages: Array<{ role: string; content: string }>;
  } {
    // Extract system message (Anthropic requires separate system parameter)
    const systemMessages = messages
      .filter(msg => msg.role === 'system')
      .map(msg => msg.content)
      .join('\n\n');

    // Convert user and assistant messages
    const claudeMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

    return {
      system: systemMessages || undefined,
      messages: claudeMessages,
    };
  }

  /**
   * Generate a chat completion using Anthropic Claude API
   */
  async generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult> {
    try {
      // Map model name to Anthropic model
      const model = this.mapModelName(params.model);
      
      // Convert messages to Claude format
      const { system, messages } = this.mapToClaudeMessages(params.messages);

      const requestBody: any = {
        model,
        messages,
        max_tokens: params.maxTokens || 2048,
        temperature: params.temperature || 0.7,
      };

      if (system) {
        requestBody.system = system;
      }

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": this.apiVersion,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      const content = data.content?.[0]?.text;
      const usage = data.usage;

      return {
        content: content || undefined,
        usage: usage ? {
          promptTokens: usage.input_tokens || 0,
          completionTokens: usage.output_tokens || 0,
          totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
        } : undefined,
      };
    } catch (error) {
      console.error('[AnthropicProvider] Chat completion error:', error);
      throw error;
    }
  }

  /**
   * Map generic model names to Anthropic model names
   */
  private mapModelName(model: string): string {
    const modelMap: Record<string, string> = {
      'gpt-3.5-turbo': 'claude-3-haiku-20240307',    // Fast, inexpensive
      'gpt-4': 'claude-3-sonnet-20240229',            // Balanced
      'gpt-4-turbo': 'claude-3-opus-20240229',        // Most capable
      'claude-3-haiku': 'claude-3-haiku-20240307',
      'claude-3-sonnet': 'claude-3-sonnet-20240229',
      'claude-3-opus': 'claude-3-opus-20240229',
    };

    return modelMap[model] || this.defaultModel;
  }

  /**
   * Generate multiple choice questions using Anthropic Claude
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
      model: "claude-3-sonnet",
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
   * Generate open-ended questions using Anthropic Claude
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
      model: "claude-3-sonnet",
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
   * Generate fill-in-the-blanks questions using Anthropic Claude
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
      model: "claude-3-sonnet",
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
