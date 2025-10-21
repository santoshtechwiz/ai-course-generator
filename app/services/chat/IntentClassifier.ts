/**
 * Intent Classifier Service
 * Classifies user chat messages into specific intents for smart routing
 */

import OpenAI from 'openai'
import { ChatIntent, IntentResult, UserContext } from '@/types/chat.types'

export class IntentClassifier {
  private openai: OpenAI
  private patterns: Record<ChatIntent, RegExp[]> = {} as Record<ChatIntent, RegExp[]>

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    this.initializePatterns()
  }

  private initializePatterns(): void {
    this.patterns = {
      [ChatIntent.NAVIGATE_COURSE]: [
        /\b(show|find|where|see|view|list|browse)\s+(me\s+)?(the\s+)?(all\s+)?courses?\b/i,
        /\bcourses?\s+(on|about|for|related to)\s+(\w+)/i,
        /\bwhat courses?\s+(do you have|are available|can i take)/i,
        /\b(available|existing)\s+courses?\b/i,
        /\b(help|find|looking for|search|need)\s+(me\s+)?(find\s+)?.*?(tutorial|course|lesson|learning|study).*?\b(on|about|for|in)?\s*(\w+)/i,
        /\b(learn|study|tutorial|course).*?\b(javascript|python|react|node|java|c\+\+|ruby|go|rust|swift|kotlin|typescript)\b/i,
      ],
      [ChatIntent.NAVIGATE_QUIZ]: [
        /\b(show|find|where|see|view|list)\s+(me\s+)?(the\s+)?quizzes?\b/i,
        /\bquizzes?\s+(on|about|for)\s+(\w+)/i,
        /\b(take|start)\s+(a\s+)?quiz\b/i,
      ],
      [ChatIntent.CREATE_QUIZ]: [
        /\b(create|make|generate|build|new)\s+(a\s+)?quiz\b/i,
        /\bquiz\s+(on|about|for)\s+(\w+)/i,
        /\bcan\s+(you|i)\s+(create|make|generate)\s+quiz/i,
        /\bgenerate\s+(\d+)?\s*(questions?|quiz)/i,
      ],
      [ChatIntent.CREATE_COURSE]: [
        /\b(create|make|generate|build|new)\s+(a\s+)?course\b/i,
        /\bcourse\s+(on|about|for)\s+(\w+)/i,
      ],
      [ChatIntent.EXPLAIN_CONCEPT]: [
        /\b(what|explain|teach|tell me|describe)\s+(is|are|about)\s+(\w+)/i,
        /\bhow\s+(does|do|to)\s+(\w+)\s+(work|function)/i,
        /\bi\s+(don't|dont|do not)\s+understand\s+(\w+)/i,
        /\bcan you explain\b/i,
        /\bwhat (is|are) the (difference|relationship) between/i,
      ],
      [ChatIntent.TROUBLESHOOT]: [
        /\b(why|can't|cannot|unable to|problem|issue|error|bug)\b/i,
        /\b(not working|doesn't work|broken|failing)/i,
        /\bhow (do i|to) (fix|solve|resolve)/i,
      ],
      [ChatIntent.SUBSCRIPTION_INFO]: [
        /\b(upgrade|subscription|plan|pricing|cost|price|pay|payment)/i,
        /\b(free|pro|premium|basic|advanced)\s+(plan|tier)/i,
        /\bhow much (does it cost|is|are)/i,
        /\b(features|benefits|limits)\s+(of|for)\s+(plan|subscription)/i,
      ],
      [ChatIntent.GENERAL_HELP]: [
        /\b(getting started|onboarding)\b/i,
        /\bwhat can (you|i) do\b/i,
        /\bhow (do i|to) use (this|the platform|courseai)\b/i,
        /\b(help|support|guide)\s+(me\s+)?(with|using|understanding)\s+(the\s+)?(platform|website|app|interface|features)\b/i,
      ],
      [ChatIntent.OFF_TOPIC]: [
        /\b(weather|joke|story|recipe|movie|music|sport|game)/i,
        /\b(hello|hi|hey|greetings)\b/i,
        /\b(who are you|what are you)/i,
      ],
    }
  }

  /**
   * Classify user message intent
   */
  async classify(message: string, context?: UserContext): Promise<IntentResult> {
    // 0. Early detection for clearly off-topic or simple greetings
    const offTopicKeywords = /\b(weather|joke|story|recipe|movie|music|sport|game|news|politics|celebrity|fashion)\b/i
    const greetingOnly = /^(hi|hello|hey|greetings?|good (morning|afternoon|evening)|howdy)[\s!.?]*$/i
    
    if (offTopicKeywords.test(message) || greetingOnly.test(message)) {
      return {
        intent: ChatIntent.OFF_TOPIC,
        confidence: 0.95,
        entities: {},
      }
    }

    // 1. Quick pattern matching for common intents
    const patternMatches = this.matchPatterns(message)

    // 2. Extract entities (course names, topics, etc.)
    const entities = this.extractEntities(message, context)

    // 3. PRIORITY: If tech topics found, override generic patterns and route to course navigation
    if (entities.topics && entities.topics.length > 0) {
      console.log(`[IntentClassifier] Found topics: ${entities.topics.join(', ')}`)
      
      // Check if there's a course-specific pattern match
      const hasCoursePattern = patternMatches.some(m => m.intent === ChatIntent.NAVIGATE_COURSE)
      const hasQuizPattern = patternMatches.some(m => m.intent === ChatIntent.NAVIGATE_QUIZ)
      
      if (hasCoursePattern) {
        // Topic + course pattern = high confidence
        console.log(`[IntentClassifier] Pattern match + topics → navigate_course (0.95)`)
        return {
          intent: ChatIntent.NAVIGATE_COURSE,
          confidence: 0.95,
          entities,
        }
      } else if (hasQuizPattern) {
        // Topic + quiz pattern = route to quiz
        console.log(`[IntentClassifier] Pattern match + topics → navigate_quiz (0.95)`)
        return {
          intent: ChatIntent.NAVIGATE_QUIZ,
          confidence: 0.95,
          entities,
        }
      } else {
        // Topic found but only generic patterns (help, explain, etc.)
        // Override with course navigation since they mentioned a specific tech topic
        console.log(`[IntentClassifier] Topics override generic pattern → navigate_course (0.90)`)
        return {
          intent: ChatIntent.NAVIGATE_COURSE,
          confidence: 0.90,
          entities,
        }
      }
    }

    // 4. Use AI only for truly ambiguous cases (low confidence AND no entities)
    if (patternMatches.length === 0 || (patternMatches[0].confidence < 0.6 && !entities.topics)) {
      console.log(`[IntentClassifier] Using AI classification (fallback)`)
      return await this.classifyWithAI(message, context)
    }

    // 5. Use pattern match result (only when no topics detected)
    console.log(`[IntentClassifier] Pattern match: ${patternMatches[0].intent} (${patternMatches[0].confidence})`)
    return {
      intent: patternMatches[0].intent,
      confidence: patternMatches[0].confidence,
      entities,
    }
  }

  /**
   * Match patterns for quick intent detection
   */
  private matchPatterns(message: string): Array<{ intent: ChatIntent; confidence: number }> {
    const results: Array<{ intent: ChatIntent; confidence: number }> = []
    const lowerMessage = message.toLowerCase()

    for (const [intentKey, patterns] of Object.entries(this.patterns)) {
      const intent = intentKey as ChatIntent
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          // Calculate confidence based on pattern specificity and keyword density
          let confidence = 0.75
          
          // Boost confidence if message contains key action words
          if (intent === ChatIntent.NAVIGATE_COURSE) {
            if (/\b(find|show|search|looking for|need|want|help.*find)\b/i.test(message)) confidence += 0.1
            if (/\b(tutorial|course|learn|study)\b/i.test(message)) confidence += 0.1
          }
          
          // Boost for specific patterns
          if (pattern.source.length > 60) confidence += 0.05
          
          results.push({ intent, confidence: Math.min(confidence, 0.95) })
          break
        }
      }
    }

    // Sort by confidence
    return results.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Extract entities from message
   */
  private extractEntities(
    message: string,
    context?: UserContext
  ): IntentResult['entities'] {
    const entities: IntentResult['entities'] = {}

    // Extract quiz types
    const quizTypes = ['mcq', 'code', 'openended', 'blanks', 'flashcard', 'ordering']
    for (const type of quizTypes) {
      if (new RegExp(`\\b${type}\\b`, 'i').test(message)) {
        entities.quizTypes = entities.quizTypes || []
        entities.quizTypes.push(type)
      }
    }

    // Extract difficulty
    const difficulties = ['easy', 'medium', 'hard']
    for (const diff of difficulties) {
      if (new RegExp(`\\b${diff}\\b`, 'i').test(message)) {
        entities.difficulty = diff
        break
      }
    }

    // Extract potential topics (words after "on", "about", "for")
    const topicMatch = message.match(/\b(on|about|for|related to)\s+([a-zA-Z0-9\s]+)(?:\?|$|\.)/i)
    if (topicMatch && topicMatch[2]) {
      entities.topics = [topicMatch[2].trim()]
    }

    // Extract programming languages and tech topics
    const techKeywords = [
      'javascript', 'python', 'java', 'typescript', 'react', 'node', 'nodejs',
      'angular', 'vue', 'c\\+\\+', 'c#', 'ruby', 'go', 'rust', 'swift', 'kotlin',
      'php', 'sql', 'html', 'css', 'docker', 'kubernetes', 'aws', 'azure',
      'machine learning', 'ai', 'data science', 'web development', 'backend',
      'frontend', 'fullstack', 'devops', 'blockchain', 'mongodb', 'postgresql'
    ]
    
    for (const keyword of techKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i')
      if (regex.test(message)) {
        entities.topics = entities.topics || []
        if (!entities.topics.includes(keyword)) {
          entities.topics.push(keyword.replace('\\+\\+', '++'))
        }
      }
    }

    return entities
  }

  /**
   * Use AI for ambiguous intent classification
   */
  private async classifyWithAI(message: string, context?: UserContext): Promise<IntentResult> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an intent classifier for CourseAI, an educational platform. 
Classify the user's intent into one of these categories:
${Object.values(ChatIntent).join(', ')}

Also extract entities like course names, quiz types, topics, and difficulty.
Respond with JSON only.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        functions: [
          {
            name: 'classify_intent',
            parameters: {
              type: 'object',
              properties: {
                intent: { 
                  type: 'string', 
                  enum: Object.values(ChatIntent) 
                },
                confidence: { 
                  type: 'number',
                  minimum: 0,
                  maximum: 1
                },
                entities: {
                  type: 'object',
                  properties: {
                    courseNames: { type: 'array', items: { type: 'string' } },
                    quizTypes: { type: 'array', items: { type: 'string' } },
                    topics: { type: 'array', items: { type: 'string' } },
                    difficulty: { type: 'string' },
                  },
                },
              },
              required: ['intent', 'confidence', 'entities'],
            },
          },
        ],
        function_call: { name: 'classify_intent' },
        max_tokens: 150,
        temperature: 0.1,
      })

      const functionCall = response.choices[0]?.message?.function_call
      if (!functionCall) {
        return this.getDefaultIntent()
      }

      return JSON.parse(functionCall.arguments)
    } catch (error) {
      console.error('Intent classification error:', error)
      return this.getDefaultIntent()
    }
  }

  /**
   * Get default intent for fallback
   */
  private getDefaultIntent(): IntentResult {
    return {
      intent: ChatIntent.GENERAL_HELP,
      confidence: 0.5,
      entities: {},
    }
  }

  /**
   * Check if query is relevant to platform
   */
  isRelevantQuery(intent: ChatIntent): boolean {
    return intent !== ChatIntent.OFF_TOPIC
  }
}
