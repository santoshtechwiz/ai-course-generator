/**
 * AI Service Utilities
 *
 * Common utilities and helpers for AI service operations to reduce code duplication.
 */

import { AIServiceResult } from './services/AIBaseService'
import { logger } from '@/lib/logger'

/**
 * Function Call Response Parser
 * Handles parsing of function call responses from AI providers
 */
export class FunctionCallParser {
  /**
   * Parse function call response with fallback to content
   */
  static parseResponse<T>(
    result: { content?: any; functionCall?: { arguments?: string } },
    componentName: string,
    operationName: string
  ): T | any {
    let responseData = result.content

    if (result.functionCall?.arguments) {
      try {
        const parsed = JSON.parse(result.functionCall.arguments)
        // Try common response structures
        responseData = parsed.questions || parsed.flashcards || parsed.summary || parsed.course || parsed
      } catch (e) {
        logger.warn(`[${componentName}] Failed to parse ${operationName} function call`, { error: e })
      }
    }

    return responseData
  }

  /**
   * Parse quiz response (questions array)
   */
  static parseQuizResponse(
    result: { content?: any; functionCall?: { arguments?: string } },
    componentName: string,
    operationName: string
  ): any[] {
    let questions: any[] = []

    if (result.functionCall?.arguments) {
      try {
        const parsed = JSON.parse(result.functionCall.arguments)
        questions = parsed.questions || []
      } catch (e) {
        logger.warn(`[${componentName}] Failed to parse ${operationName} function call`, { error: e })
      }
    }

    return questions
  }

  /**
   * Parse flashcard response
   */
  static parseFlashcardResponse(
    result: { content?: any; functionCall?: { arguments?: string } },
    componentName: string
  ): any[] {
    let flashcards: any[] = []

    if (result.functionCall?.arguments) {
      try {
        const parsed = JSON.parse(result.functionCall.arguments)
        flashcards = parsed.flashcards || []
      } catch (e) {
        logger.warn(`[${componentName}] Failed to parse flashcard function call`, { error: e })
      }
    }

    return flashcards
  }
}

/**
 * Response Builder
 * Standardizes response creation across AI services
 */
export class ResponseBuilder {
  /**
   * Create success response with usage tracking
   */
  static success<T>(
    data: T,
    creditsUsed: number,
    tokensUsed?: number
  ): AIServiceResult<T> {
    return {
      success: true,
      data,
      usage: {
        creditsUsed,
        tokensUsed,
      },
    }
  }

  /**
   * Create error response
   */
  static error(
    message: string,
    errorCode: string = 'UNKNOWN_ERROR'
  ): AIServiceResult<any> {
    return {
      success: false,
      error: message,
      errorCode,
    }
  }
}

/**
 * Chat Completion Helper
 * Manages chat completion parameters and configurations
 */
export class ChatCompletionHelper {
  /**
   * Get standard parameters for basic tier operations
   */
  static getBasicParams(operation: string): {
    temperature: number
    maxTokens: number
  } {
    const defaults = {
      temperature: 0.7,
      maxTokens: 2048,
    }

    // Operation-specific overrides
    const overrides: Record<string, Partial<typeof defaults>> = {
      generateFlashcards: { maxTokens: 1536 },
      generateOrderingQuiz: { maxTokens: 2048 },
    }

    return { ...defaults, ...overrides[operation] }
  }

  /**
   * Get premium parameters for premium tier operations
   */
  static getPremiumParams(operation: string): {
    temperature: number
    maxTokens: number
  } {
    const defaults = {
      temperature: 0.8,
      maxTokens: 4096,
    }

    // Operation-specific overrides
    const overrides: Record<string, Partial<typeof defaults>> = {
      generateOpenEndedQuestionsQuiz: { temperature: 0.9, maxTokens: 6144 },
      generateCodeQuiz: { maxTokens: 8192 },
      generateCourse: { temperature: 0.8, maxTokens: 8192 },
      generateVideoQuiz: { maxTokens: 4096 },
    }

    return { ...defaults, ...overrides[operation] }
  }
}

/**
 * AI Logger
 * Standardized logging for AI components
 */
export class AILogger {
  private componentName: string

  constructor(componentName: string) {
    this.componentName = componentName
  }

  debug(message: string, context?: any): void {
    logger.debug(`[${this.componentName}] ${message}`, context)
  }

  info(message: string, context?: any): void {
    logger.info(`[${this.componentName}] ${message}`, context)
  }

  warn(message: string, context?: any): void {
    logger.warn(`[${this.componentName}] ${message}`, context)
  }

  error(message: string, error?: any, context?: any): void {
    logger.error(`[${this.componentName}] ${message}`, { error, ...context })
  }

  operationStart(operation: string, context: { userId: string; requestId: string }): void {
    this.debug(`Starting ${operation}`, context)
  }

  operationSuccess(operation: string, context: { userId: string; requestId: string; duration?: number }): void {
    this.info(`${operation} completed successfully`, context)
  }

  operationFailed(operation: string, error: any, context: { userId: string; requestId: string }): void {
    this.error(`${operation} failed`, error, context)
  }
}

/**
 * Error Handler
 * Standardized error handling for AI operations
 */
export class ErrorHandler {
  /**
   * Handle operation errors with consistent logging and response
   */
  static handleOperationError(
    operation: string,
    error: any,
    logger: AILogger,
    context: { userId: string; requestId: string }
  ): AIServiceResult<any> {
    logger.operationFailed(operation, error, context)

    return ResponseBuilder.error(
      error instanceof Error ? error.message : 'AI operation failed',
      'AI_OPERATION_FAILED'
    )
  }

  /**
   * Handle parsing errors
   */
  static handleParseError(
    operation: string,
    error: any,
    logger: AILogger
  ): void {
    logger.warn(`Failed to parse ${operation} function call`, { error })
  }
}