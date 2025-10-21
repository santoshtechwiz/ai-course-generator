
import { OpenAIProvider } from "./openai-provider";
import { GoogleAIProvider } from "./google-ai-provider";
import { AnthropicProvider } from "./anthropic-provider";
import { AIProvider } from "../interfaces";

/**
 * Available AI providers
 */
export type AIProviderType = "openai" | "google" | "anthropic";

/**
 * Factory for creating AI providers
 */
export class AIProviderFactory {
  /**
   * Create an AI provider instance
   * 
   * @param type The type of AI provider to create
   * @param apiKey Optional API key for the provider
   * @returns An instance of the AI provider
   */
  static createProvider(type: AIProviderType = "openai", apiKey?: string): AIProvider {
    switch (type) {
      case "openai":
        return new OpenAIProvider(apiKey);
      case "google":
        return new GoogleAIProvider(apiKey);
      case "anthropic":
        return new AnthropicProvider(apiKey);
      default:
        throw new Error(`Unknown AI provider type: ${type}`);
    }
  }
}

/**
 * Get the configured AI provider
 * 
 * @returns The default AI provider from environment configuration
 */
export function getAIProvider(): AIProvider {
  const providerType = (process.env.AI_PROVIDER_TYPE as AIProviderType) || "openai";
  const apiKey = process.env.AI_PROVIDER_API_KEY || undefined;
  
  return AIProviderFactory.createProvider(providerType, apiKey);
}

/**
 * The default AI provider instance - lazy loaded to avoid initialization issues
 */
let _defaultAIProvider: AIProvider | null = null;

export function getDefaultAIProvider(): AIProvider {
  if (!_defaultAIProvider) {
    _defaultAIProvider = getAIProvider();
  }
  return _defaultAIProvider;
}

/**
 * @deprecated Use getDefaultAIProvider() instead to avoid initialization issues
 */
export const defaultAIProvider = getDefaultAIProvider();
