/**
 * PremiumAIService - AI Service for PREMIUM and ENTERPRISE tier users
 * 
 * Uses advanced models (GPT-4o, GPT-4-turbo) with higher limits and additional features
 * like code quiz generation and open-ended questions.
 */

import type { SubscriptionPlanType } from '@/types/subscription-plans'
import { AIBaseService, type AIServiceContext, type AIServiceResult } from './AIBaseService'
import { AI_MODELS } from '@/config/ai.config'
import { buildMCQPrompt, buildMCQPromptWithSchema } from '@/lib/ai/prompts/mcq.prompt'
import { buildCodePrompt } from '@/lib/ai/prompts/code.prompt'
import { buildOpenEndedPrompt, buildOpenEndedPromptWithSchema } from '@/lib/ai/prompts/openended.prompt'
import { buildBlanksPrompt, buildBlanksPromptWithSchema } from '@/lib/ai/prompts/blanks.prompt'
import { buildFlashcardPrompt, getFlashcardFunctionSchema } from '@/lib/ai/prompts/flashcard.prompt'
import { buildOrderingPrompt, buildOrderingPromptWithSchema } from '@/lib/ai/prompts/ordering.prompt'
import { buildVideoQuizPrompt, getVideoQuizMCQFunctionSchema, buildVideoQuizPromptWithSchema } from '@/lib/ai/prompts/video.prompt'
import { buildSummaryPrompt, getSummaryFunctionSchema, truncateTranscript, estimateTokenCount, buildSummaryPromptWithSchema } from '@/lib/ai/prompts/summary.prompt'
import { buildCoursePrompt, buildCoursePromptWithSchema } from '@/lib/ai/prompts/course.prompt'
import { buildDocumentPrompt, buildDocumentPromptWithSchema } from '@/lib/ai/prompts/document.prompt'

export class PremiumAIService extends AIBaseService {
  constructor(context: AIServiceContext) {
    super(context)
  }

  getSubscriptionPlan(): SubscriptionPlanType {
    return this.context.subscriptionPlan
  }

  getServiceName(): string {
    return 'PremiumAIService'
  }

  // ============= All Basic Features (inherited functionality) =============

  /**
   * Generate Multiple Choice Questions (Enhanced for Premium)
   * @alias generateMCQ (maintained for backward compatibility)
   */
  async generateMultipleChoiceQuiz(params: {
    topic: string
    numberOfQuestions: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    try {
      const accessCheck = await this.checkFeatureAccess('quiz-mcq')
      if (!accessCheck.success) return accessCheck

      const topicValidation = this.sanitizeTextInput(params.topic, 200)
      if (!topicValidation.isValid) {
        return { success: false, error: topicValidation.error }
      }

      const countValidation = this.validateNumberInput(
        params.numberOfQuestions,
        1,
        100, // Higher limit for premium
        20
      )
      if (!countValidation.isValid) {
        return { success: false, error: countValidation.error }
      }

      const limitCheck = this.validatePlanLimits('quiz-mcq', countValidation.sanitizedInput!)
      if (!limitCheck.success) return limitCheck

      const creditCost = this.getCreditCost('quiz-mcq')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      const rateLimitCheck = await this.checkRateLimit()
      if (!rateLimitCheck.success) return rateLimitCheck

      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel() // Will use GPT-4o or GPT-4-turbo

      const { messages, functions, functionCall } = buildMCQPromptWithSchema({
        topic: topicValidation.sanitizedInput!,
        numberOfQuestions: countValidation.sanitizedInput!,
        difficulty: params.difficulty || 'medium',
        isPremium: true,
      })

      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        functions,
        functionCall,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      })

      await this.logUsage({
        featureType: 'quiz-mcq',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      // Parse function call response or use content
      let responseData = result.content
      if (result.functionCall?.arguments) {
        try {
          const parsed = JSON.parse(result.functionCall.arguments)
          responseData = parsed.questions || parsed
        } catch (e) {
          console.error('Failed to parse function call arguments:', e)
        }
      }

      return {
        success: true,
        data: responseData,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * @deprecated Use generateMultipleChoiceQuiz instead
   * @alias generateMultipleChoiceQuiz
   */
  async generateMCQ(params: {
    topic: string
    numberOfQuestions: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    return this.generateMultipleChoiceQuiz(params)
  }

  // ============= Premium-Only Features =============

  /**
   * Generate Code Quiz (Premium Feature)
   * @description Creates coding-based quiz questions with programming exercises
   */
  async generateCodeBasedQuiz(params: {
    topic: string
    numberOfQuestions: number
    programmingLanguage?: string
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    try {
      const accessCheck = await this.checkFeatureAccess('quiz-code')
      if (!accessCheck.success) return accessCheck

      const topicValidation = this.sanitizeTextInput(params.topic, 200)
      if (!topicValidation.isValid) {
        return { success: false, error: topicValidation.error }
      }

      const countValidation = this.validateNumberInput(
        params.numberOfQuestions,
        1,
        20,
        5
      )
      if (!countValidation.isValid) {
        return { success: false, error: countValidation.error }
      }

      const languageValidation = this.sanitizeTextInput(
        params.programmingLanguage || 'javascript',
        50
      )
      if (!languageValidation.isValid) {
        return { success: false, error: languageValidation.error }
      }

      const limitCheck = this.validatePlanLimits('quiz-code', countValidation.sanitizedInput!)
      if (!limitCheck.success) return limitCheck

      const creditCost = this.getCreditCost('quiz-code')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()

      const messages = buildCodePrompt({
        topic: topicValidation.sanitizedInput!,
        numberOfQuestions: countValidation.sanitizedInput!,
        programmingLanguage: languageValidation.sanitizedInput!,
        difficulty: params.difficulty || 'medium',
      })

      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      })

      await this.logUsage({
        featureType: 'quiz-code',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      return {
        success: true,
        data: result.content,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * @deprecated Use generateCodeBasedQuiz instead
   */
  async generateCodeQuiz(params: {
    topic: string
    numberOfQuestions: number
    programmingLanguage?: string
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    return this.generateCodeBasedQuiz(params)
  }

  /**
   * Generate Open-Ended Quiz (Premium Feature)
   * @description Creates essay-style questions requiring detailed answers
   */
  async generateOpenEndedQuestionsQuiz(params: {
    topic: string
    numberOfQuestions: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    try {
      const accessCheck = await this.checkFeatureAccess('quiz-openended')
      if (!accessCheck.success) return accessCheck

      const topicValidation = this.sanitizeTextInput(params.topic, 200)
      if (!topicValidation.isValid) {
        return { success: false, error: topicValidation.error }
      }

      const countValidation = this.validateNumberInput(
        params.numberOfQuestions,
        1,
        20,
        5
      )
      if (!countValidation.isValid) {
        return { success: false, error: countValidation.error }
      }

      const limitCheck = this.validatePlanLimits('quiz-openended', countValidation.sanitizedInput!)
      if (!limitCheck.success) return limitCheck

      const creditCost = this.getCreditCost('quiz-openended')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()

      const { messages, functions, functionCall } = buildOpenEndedPromptWithSchema({
        topic: topicValidation.sanitizedInput!,
        numberOfQuestions: countValidation.sanitizedInput!,
        difficulty: params.difficulty || 'medium',
      })

      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        functions,
        functionCall,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      })

      await this.logUsage({
        featureType: 'quiz-openended',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      // Parse function call response or use content
      let responseData = result.content
      if (result.functionCall?.arguments) {
        try {
          const parsed = JSON.parse(result.functionCall.arguments)
          responseData = parsed.questions || parsed
        } catch (e) {
          console.error('Failed to parse function call arguments:', e)
        }
      }

      return {
        success: true,
        data: responseData,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Generate Fill-in-the-Blanks Quiz (Premium Feature)
   * @description Creates fill-in-the-blanks questions for vocabulary and concept testing
   */
  async generateFillInTheBlanksQuiz(params: {
    topic: string
    numberOfQuestions: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    try {
      const accessCheck = await this.checkFeatureAccess('quiz-blanks')
      if (!accessCheck.success) return accessCheck

      const topicValidation = this.sanitizeTextInput(params.topic, 200)
      if (!topicValidation.isValid) {
        return { success: false, error: topicValidation.error }
      }

      const countValidation = this.validateNumberInput(
        params.numberOfQuestions,
        1,
        30,
        10
      )
      if (!countValidation.isValid) {
        return { success: false, error: countValidation.error }
      }

      const limitCheck = this.validatePlanLimits('quiz-blanks', countValidation.sanitizedInput!)
      if (!limitCheck.success) return limitCheck

      const creditCost = this.getCreditCost('quiz-blanks')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()
      
      const promptData = buildBlanksPromptWithSchema({
        topic: topicValidation.sanitizedInput!,
        numberOfQuestions: countValidation.sanitizedInput!,
        difficulty: params.difficulty,
      })
      
      const result = await this.provider.generateChatCompletion({
        model,
        messages: promptData.messages,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        functions: promptData.functions,
        functionCall: promptData.functionCall,
      })

      await this.logUsage({
        featureType: 'quiz-blanks',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      // Parse function call response or use content
      let responseData = result.content
      if (result.functionCall?.arguments) {
        try {
          const parsed = JSON.parse(result.functionCall.arguments)
          responseData = parsed.questions || parsed
        } catch (e) {
          console.error('Failed to parse function call arguments:', e)
        }
      }

      return {
        success: true,
        data: responseData,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Generate Flashcards (Premium Feature)
   * @description Creates educational flashcards with questions and answers
   */
  async generateFlashcards(params: {
    topic: string
    count: number
  }): Promise<AIServiceResult> {
    try {
      const accessCheck = await this.checkFeatureAccess('quiz-flashcard')
      if (!accessCheck.success) return accessCheck

      const topicValidation = this.sanitizeTextInput(params.topic, 200)
      if (!topicValidation.isValid) {
        return { success: false, error: topicValidation.error }
      }

      const countValidation = this.validateNumberInput(params.count, 1, 100, 10)
      if (!countValidation.isValid) {
        return { success: false, error: countValidation.error }
      }

      const creditCost = this.getCreditCost('quiz-flashcard')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()

      const messages = buildFlashcardPrompt({
        topic: topicValidation.sanitizedInput!,
        count: countValidation.sanitizedInput!,
      })

      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        functions: [getFlashcardFunctionSchema()],
        functionCall: { name: 'generate_flashcards' },
      })

      await this.logUsage({
        featureType: 'quiz-flashcard',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      return {
        success: true,
        data: result.functionCall 
          ? JSON.parse(result.functionCall.arguments).flashcards 
          : result.content,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Generate Ordering Quiz (Premium Feature)
   * @description Creates sequencing/ordering questions for process-based learning
   */
  async generateOrderingQuiz(params: {
    topic: string
    numberOfSteps?: number
    difficulty?: 'easy' | 'medium' | 'hard'
    numberOfQuestions?: number
  }): Promise<AIServiceResult> {
    try {
      const accessCheck = await this.checkFeatureAccess('quiz-ordering')
      if (!accessCheck.success) return accessCheck

      const topicValidation = this.sanitizeTextInput(params.topic, 200)
      if (!topicValidation.isValid) {
        return { success: false, error: topicValidation.error }
      }

      const stepsValidation = this.validateNumberInput(params.numberOfSteps || 5, 3, 10, 5)
      if (!stepsValidation.isValid) {
        return { success: false, error: stepsValidation.error }
      }

      const questionsValidation = this.validateNumberInput(params.numberOfQuestions || 5, 1, 15, 5)
      if (!questionsValidation.isValid) {
        return { success: false, error: questionsValidation.error }
      }

      const difficultyValidation = this.validateDifficulty(params.difficulty)
      if (!difficultyValidation.isValid) {
        return { success: false, error: difficultyValidation.error }
      }

      // Check credits for ordering quiz
      const creditCost = this.getCreditCost('quiz-ordering')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      // Check rate limits
      const rateLimitCheck = await this.checkRateLimit()
      if (!rateLimitCheck.success) return rateLimitCheck

      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()

      const { messages, functions, functionCall } = buildOrderingPromptWithSchema({
        topic: topicValidation.sanitizedInput!,
        numberOfSteps: stepsValidation.sanitizedInput!,
        difficulty: difficultyValidation.sanitizedInput!,
        numberOfQuestions: questionsValidation.sanitizedInput!,
      })

      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        functions,
        functionCall,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      })

      await this.logUsage({
        featureType: 'quiz-ordering',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      // Parse function call response or use content
      let responseData = result.content
      if (result.functionCall?.arguments) {
        try {
          const parsed = JSON.parse(result.functionCall.arguments)
          responseData = parsed.steps || parsed
        } catch (e) {
          console.error('Failed to parse function call arguments:', e)
        }
      }

      return {
        success: true,
        data: responseData,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Generate Video Quiz (Premium Feature)
   * @description Creates quiz questions from video transcripts
   */
  async generateVideoQuiz(params: {
    courseTitle: string
    transcript: string
    numberOfQuestions: number
    quizType?: 'mcq' | 'openended'
  }): Promise<AIServiceResult> {
    try {
      const accessCheck = await this.checkFeatureAccess('quiz-video')
      if (!accessCheck.success) return accessCheck

      const titleValidation = this.sanitizeTextInput(params.courseTitle, 200)
      if (!titleValidation.isValid) {
        return { success: false, error: titleValidation.error }
      }

      const transcriptValidation = this.sanitizeTextInput(params.transcript, 50000)
      if (!transcriptValidation.isValid) {
        return { success: false, error: transcriptValidation.error }
      }

      const countValidation = this.validateNumberInput(
        params.numberOfQuestions,
        1,
        20,
        5
      )
      if (!countValidation.isValid) {
        return { success: false, error: countValidation.error }
      }

      const limitCheck = this.validatePlanLimits('quiz-video', countValidation.sanitizedInput!)
      if (!limitCheck.success) return limitCheck

      const creditCost = this.getCreditCost('quiz-video')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      const rateLimitCheck = await this.checkRateLimit()
      if (!rateLimitCheck.success) return rateLimitCheck

      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()

      const { messages, functions, functionCall } = buildVideoQuizPromptWithSchema({
        courseTitle: titleValidation.sanitizedInput!,
        transcript: transcriptValidation.sanitizedInput!,
        numberOfQuestions: countValidation.sanitizedInput!,
        quizType: params.quizType || 'mcq',
      })

      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        functions,
        functionCall,
        temperature: options.temperature,
        maxTokens: options.maxTokens || 4096,
      })

      await this.logUsage({
        featureType: 'quiz-video',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      // Parse function call response or use content
      let responseData = result.content
      if (result.functionCall?.arguments) {
        try {
          const parsed = JSON.parse(result.functionCall.arguments)
          responseData = parsed.questions || parsed
        } catch (e) {
          console.error('Failed to parse function call arguments:', e)
        }
      }

      return {
        success: true,
        data: responseData,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Generate Summary (Premium Feature)
   * @description Creates concise summaries from transcripts or text content
   */
  async generateSummary(params: {
    transcript: string
    summaryLength?: number
    maxTokens?: number
  }): Promise<AIServiceResult> {
    try {
      // Check authentication (summary generation should be authenticated)
      if (!this.context.isAuthenticated) {
        return {
          success: false,
          error: 'You must be logged in to generate summaries.',
          errorCode: 'AUTH_REQUIRED',
        }
      }

      const summaryLength = params.summaryLength || 250
      const maxTokens = params.maxTokens || 4000

      // Estimate token count and truncate if needed
      const estimatedTokens = estimateTokenCount(params.transcript)
      let transcript = params.transcript

      if (estimatedTokens > maxTokens) {
        console.log(`[PremiumAIService] Transcript too long (${estimatedTokens} tokens), truncating to ${maxTokens}`)
        transcript = truncateTranscript(params.transcript, maxTokens)
      }

      const transcriptValidation = this.sanitizeTextInput(transcript, 50000)
      if (!transcriptValidation.isValid) {
        return { success: false, error: transcriptValidation.error }
      }

      // Summary generation typically costs 1 credit
      const creditCost = 1
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      const rateLimitCheck = await this.checkRateLimit()
      if (!rateLimitCheck.success) return rateLimitCheck

      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()

      const messages = buildSummaryPrompt({
        transcript: transcriptValidation.sanitizedInput!,
        summaryLength,
      })

      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        temperature: 0.7,
        maxTokens: Math.min(summaryLength * 2, 1000), // Allow 2x words for tokens
        functions: [getSummaryFunctionSchema()],
        functionCall: { name: 'generate_summary' },
      })

      await this.logUsage({
        featureType: 'summary-generation',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      return {
        success: true,
        data: result.functionCall 
          ? JSON.parse(result.functionCall.arguments).summary
          : result.content,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Generate Course Content (Enterprise Feature)
   */
  async generateCourseContent(params: {
    topic: string
    numberOfModules: number
    difficulty?: 'easy' | 'medium' | 'hard'
    includeQuizzes?: boolean
  }): Promise<AIServiceResult> {
    try {
      const accessCheck = await this.checkFeatureAccess('course-creation')
      if (!accessCheck.success) return accessCheck

      const topicValidation = this.sanitizeTextInput(params.topic, 200)
      if (!topicValidation.isValid) {
        return { success: false, error: topicValidation.error }
      }

      const countValidation = this.validateNumberInput(
        params.numberOfModules,
        1,
        50,
        10
      )
      if (!countValidation.isValid) {
        return { success: false, error: countValidation.error }
      }

      const creditCost = this.getCreditCost('course-creation')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()

      const { messages, functions, functionCall } = buildCoursePromptWithSchema({
        topic: topicValidation.sanitizedInput!,
        numberOfModules: countValidation.sanitizedInput!,
        difficulty: params.difficulty || 'medium',
        includeQuizzes: params.includeQuizzes,
      })

      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        functions,
        functionCall,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      })

      await this.logUsage({
        featureType: 'course-creation',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      // Parse function call response or use content
      let responseData = result.content
      if (result.functionCall?.arguments) {
        try {
          const parsed = JSON.parse(result.functionCall.arguments)
          responseData = parsed
        } catch (e) {
          console.error('Failed to parse function call arguments:', e)
        }
      }

      return {
        success: true,
        data: responseData,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Generate Quiz from Document (Premium Feature)
   */
  async generateDocumentQuiz(params: {
    documentText: string
    numberOfQuestions: number
    quizType?: 'mcq' | 'openended' | 'mixed'
  }): Promise<AIServiceResult> {
    try {
      const accessCheck = await this.checkFeatureAccess('document-quiz')
      if (!accessCheck.success) return accessCheck

      const textValidation = this.sanitizeTextInput(params.documentText, 50000)
      if (!textValidation.isValid) {
        return { success: false, error: textValidation.error }
      }

      const countValidation = this.validateNumberInput(
        params.numberOfQuestions,
        1,
        50,
        10
      )
      if (!countValidation.isValid) {
        return { success: false, error: countValidation.error }
      }

      const creditCost = this.getCreditCost('document-quiz')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()

      const { messages, functions, functionCall } = buildDocumentPromptWithSchema({
        documentText: textValidation.sanitizedInput!,
        numberOfQuestions: countValidation.sanitizedInput!,
        quizType: params.quizType || 'mcq',
      })

      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        functions,
        functionCall,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      })

      await this.logUsage({
        featureType: 'document-quiz',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      // Parse function call response or use content
      let responseData = result.content
      if (result.functionCall?.arguments) {
        try {
          const parsed = JSON.parse(result.functionCall.arguments)
          responseData = parsed.questions || parsed
        } catch (e) {
          console.error('Failed to parse function call arguments:', e)
        }
      }

      return {
        success: true,
        data: responseData,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Batch Generate Multiple Quizzes (Enterprise Feature)
   */
  async batchGenerateQuizzes(params: {
    topics: string[]
    questionsPerTopic: number
    quizType: 'mcq' | 'code' | 'openended'
  }): Promise<AIServiceResult> {
    try {
      if (!Array.isArray(params.topics) || params.topics.length === 0) {
        return {
          success: false,
          error: 'Topics array must contain at least one topic',
        }
      }

      if (params.topics.length > 10) {
        return {
          success: false,
          error: 'Maximum 10 topics allowed for batch generation',
        }
      }

      const results = []
      let totalCreditsUsed = 0
      let totalTokensUsed = 0

      for (const topic of params.topics) {
        let result: AIServiceResult

        switch (params.quizType) {
          case 'mcq':
            result = await this.generateMultipleChoiceQuiz({
              topic,
              numberOfQuestions: params.questionsPerTopic,
            })
            break
          case 'code':
            result = await this.generateCodeBasedQuiz({
              topic,
              numberOfQuestions: params.questionsPerTopic,
            })
            break
          case 'openended':
            result = await this.generateOpenEndedQuestionsQuiz({
              topic,
              numberOfQuestions: params.questionsPerTopic,
            })
            break
          default:
            return {
              success: false,
              error: 'Invalid quiz type',
            }
        }

        if (!result.success) {
          return result // Return first error
        }

        results.push({ topic, ...result })
        totalCreditsUsed += result.usage?.creditsUsed || 0
        totalTokensUsed += result.usage?.tokensUsed || 0
      }

      return {
        success: true,
        data: results,
        usage: {
          creditsUsed: totalCreditsUsed,
          tokensUsed: totalTokensUsed,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }
}

export default PremiumAIService
