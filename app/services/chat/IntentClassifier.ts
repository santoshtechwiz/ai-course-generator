/**
 * Intent Classifier Service - FIXED
 * Classifies user chat messages into specific intents for smart routing
 */

import OpenAI from 'openai'
import { NlpIntentClassifier } from './NlpIntentClassifier'
import { ChatIntent, IntentResult, UserContext } from '../../../types/chat.types'

export class IntentClassifier {
  private openai: OpenAI
  private nlpClassifier: NlpIntentClassifier
  private patterns: Record<ChatIntent, RegExp[]> = {} as Record<ChatIntent, RegExp[]>

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    this.nlpClassifier = new NlpIntentClassifier('./models/chat-intents.nlp')
    this.initializePatterns()
    // Initialize NLP classifier asynchronously
    this.initializeNlpClassifier().catch(error => {
      console.warn('[IntentClassifier] Failed to initialize NLP classifier:', error)
    })
  }

  private initializePatterns(): void {
    this.patterns = {
      [ChatIntent.NAVIGATE_COURSE]: [
        /\b(show|find|where|see|view|list|browse|get|display)\s+(me\s+)?(the\s+)?(all\s+)?courses?\b/i,
        /\bcourses?\s+(on|about|for|related to|regarding|covering)\s+/i,
        /\bwhat courses?\s+(do you have|are available|can i take|are there|exist)/i,
        /\b(available|existing|all)\s+courses?\b/i,
        /\b(help|find|looking for|search|need|want|interested in)\s+(me\s+)?(find\s+|with\s+)?.*?(tutorial|course|lesson|learning|study|class|training)/i,
        /\bi\s+(want|need|would like)\s+to\s+(learn|study|understand|master)\b/i,
        /\b(learn|study|understand|master|get into)\s+(about\s+)?.*?\b(javascript|python|react|node|java|c\+\+|ruby|go|rust|swift|kotlin|typescript|angular|vue|php|sql|html|css|docker|kubernetes)\b/i,
        /\b(tutorial|course|lesson|guide|learning path)\s+(on|about|for|regarding)\b/i,
        /\bwhere\s+(can|do)\s+(i|we)\s+(learn|study|find|get)\b/i,
        /\bhow\s+(can|do)\s+(i|we)\s+(learn|study|start learning)\b/i,
      ],
      [ChatIntent.NAVIGATE_QUIZ]: [
        /\b(show|find|where|see|view|list|browse)\s+(me\s+)?(the\s+)?(all\s+)?quizz?es?\b/i,
        /\bquizz?es?\s+(on|about|for|regarding)\s+/i,
        /\b(take|start|do|attempt|try)\s+(a\s+|an\s+)?quizz?/i,
        /\bwhere\s+(can|do)\s+(i|we)\s+(take|find|do)\s+(a\s+)?quizz?/i,
        /\b(test|assess|check|evaluate)\s+(my|your)\s+(knowledge|skills|understanding)/i,
        /\bpractice\s+(questions?|problems?|exercises?)\b/i,
      ],
      [ChatIntent.CREATE_QUIZ]: [
        /\b(create|make|generate|build|design|set up)\s+(a\s+|an\s+|new\s+)?quizz?/i,
        /\b(custom|personalized|new)\s+quizz?/i,
        /\bcan\s+(you|i|we)\s+(create|make|generate|build)\s+(a\s+)?quizz?/i,
        /\bgenerate\s+(\d+)?\s*quizz?\s+(questions?|items?)/i,
        /\bi\s+(want|need|would like)\s+(to\s+)?(create|make|generate)\s+(a\s+)?quizz?/i,
      ],
      [ChatIntent.CREATE_COURSE]: [
        /\b(create|make|generate|build|design|set up)\s+(a\s+|an\s+|new\s+)?course\b/i,
        /\b(custom|personalized|new)\s+course\b/i,
        /\bcan\s+(you|i|we)\s+(create|make|generate|build)\s+(a\s+)?course/i,
        /\bi\s+(want|need|would like)\s+(to\s+)?(create|make|build)\s+(a\s+)?course/i,
      ],
      [ChatIntent.EXPLAIN_CONCEPT]: [
        /\b(what|explain|teach|tell me|describe|clarify|define)\s+(is|are|does|means?)\s+/i,
        /\bcan you (explain|tell me|describe|clarify|teach me)\b/i,
        /\bhow\s+(does|do|did|is|are)\s+.*?\s+(work|function|operate|happen)/i,
        /\bhow\s+to\s+(understand|use|implement|apply)\b/i,
        /\bi\s+(don't|dont|do not|didn't|didnt|can't|cant|cannot)\s+(understand|get|know|see)/i,
        /\b(confused|unclear|unsure)\s+(about|regarding|on)\b/i,
        /\bwhat\s+(is|are)\s+the\s+(difference|relationship|connection)\s+between/i,
        /\b(compare|contrast|difference between)\b/i,
        /\bwhy\s+(is|are|does|do|did|would|should)\b/i,
      ],
      [ChatIntent.TROUBLESHOOT]: [
        /\b(problem|issue|error|bug|trouble|difficulty|struggle|stuck)\b/i,
        /\b(not working|doesn't work|dont work|isn't working|broken|failing|failed)/i,
        /\b(why|can't|cant|cannot|unable to|won't|wont)\s+/i,
        /\bhow\s+(do i|to|can i)\s+(fix|solve|resolve|repair|correct|debug)/i,
        /\b(help|assist)\s+(me\s+)?(with\s+)?(fixing|solving|resolving)\b/i,
        /\b(getting|received|seeing)\s+(an\s+)?(error|exception|warning)/i,
      ],
      [ChatIntent.SUBSCRIPTION_INFO]: [
        /\b(upgrade|subscription|plan|pricing|cost|price|pay|payment|billing|charge)/i,
        /\b(free|pro|premium|basic|advanced|tier)\s+(plan|account|version|subscription)/i,
        /\bhow much\s+(does it cost|is|are|to|for)/i,
        /\b(features?|benefits?|limits?|limitations?|perks?|advantages?)\s+(of|for|in|with)\s+(the\s+)?(plan|subscription|account)/i,
        /\bwhat\s+(do|does)\s+(i|we)\s+get\s+(with|in|from)\b/i,
        /\b(difference|compare|comparison)\s+between\s+(plans?|tiers?|subscriptions?)/i,
      ],
      [ChatIntent.GENERAL_HELP]: [
        /\b(getting started|get started|start|begin|onboarding|new here|first time)/i,
        /\bhow\s+(do i|to|can i)\s+(use|start|begin|get started with)\s+(this|the platform|courseai)/i,
        /\bwhat\s+(can|could)\s+(you|i|this|the platform)\s+do\b/i,
        /\bshow me\s+(around|what you can do|the features)/i,
        /\b(help|support|guide|assist|tutorial)\s+(me\s+)?(with|using|understanding|navigating)\s+(the\s+)?(platform|website|app|interface|features|site)/i,
        /\bhow\s+does\s+(this|the platform|courseai)\s+work/i,
        /\bwhat\s+(are|is)\s+(the|your)\s+(features?|capabilities?|functions?)/i,
      ],
      [ChatIntent.OFF_TOPIC]: [
        /\b(weather|joke|story|recipe|movie|film|music|song|sport|game|news|politics|celebrity|fashion|shopping|restaurant)\b/i,
        /\b(hello|hi|hey|greetings|good morning|good afternoon|good evening|howdy)\b/i,
        /\b(who are you|what are you|your name|introduce yourself)/i,
        /\b(how are you|how's it going|what's up|wassup)/i,
      ],
    }
  }

  /**
   * Initialize NLP classifier with default intents
   */
  private async initializeNlpClassifier(): Promise<void> {
    try {
      // Add intents from config
      const { DEFAULT_INTENTS } = await import('../../../config/intent-config')

      for (const [intentName, config] of Object.entries(DEFAULT_INTENTS)) {
        this.nlpClassifier.addIntent(intentName, (config as any).utterances, (config as any).responses)
      }

      // Train if not already trained
      if (!this.nlpClassifier.isTrained()) {
        await this.nlpClassifier.train()
        console.log('[IntentClassifier] NLP model trained successfully')
      }
    } catch (error) {
      console.warn('[IntentClassifier] Failed to initialize NLP classifier:', error)
    }
  }

  /**
   * Classify user message intent
   * FIX #2: Properly validates off-topic before tech topic routing
   */
  async classify(message: string, context?: UserContext): Promise<IntentResult> {
    const normalizedMessage = message.trim().toLowerCase()

    // 1. Early detection for simple greetings
    const simpleGreeting = /^(hi|hello|hey|greetings?|good\s+(morning|afternoon|evening)|howdy|sup|wassup|yo)[\s!.?]*$/i
    if (simpleGreeting.test(message)) {
      return {
        intent: ChatIntent.OFF_TOPIC,
        confidence: 0.95,
        entities: {
          quantity: 0,
        },
      }
    }

    // 2. Extract entities early (helps with context)
    const entities = this.extractEntities(message, context)

    // 3. Detect clearly off-topic queries BEFORE tech routing
    // FIX: Check explicit off-topic keywords even if tech content found
    const offTopicKeywords = /\b(weather|joke|story|recipe|movie|film|music|song|sport|game|celebrity|fashion|shopping|restaurant)\b/i
    const hasTechContent = entities.topics && entities.topics.length > 0
    
    if (offTopicKeywords.test(normalizedMessage)) {
      // Off-topic keyword found - check if it's actually about tech
      // e.g., "python weather module" should be NAVIGATE_COURSE, not OFF_TOPIC
      const isTechRelated = /\b(library|module|framework|package|tool|language|framework|api|programming|code|develop)\b/i.test(message)
      
      if (!isTechRelated) {
        return {
          intent: ChatIntent.OFF_TOPIC,
          confidence: 0.90,
          entities: {
            quantity: 0,
          },
        }
      }
    }

    // 4. Quick pattern matching
    const patternMatches = this.matchPatterns(message)

    // 5. PRIORITY: If tech topics found, intelligently route based on context
    if (entities.topics && entities.topics.length > 0) {
      console.log(`[IntentClassifier] Detected topics: ${entities.topics.join(', ')}`)
      
      // Check for specific intent patterns
      const hasCoursePattern = patternMatches.some(m => m.intent === ChatIntent.NAVIGATE_COURSE)
      const hasQuizPattern = patternMatches.some(m => m.intent === ChatIntent.NAVIGATE_QUIZ)
      const hasCreateQuizPattern = patternMatches.some(m => m.intent === ChatIntent.CREATE_QUIZ)
      const hasCreateCoursePattern = patternMatches.some(m => m.intent === ChatIntent.CREATE_COURSE)
      const hasExplainPattern = patternMatches.some(m => m.intent === ChatIntent.EXPLAIN_CONCEPT)
      
      if (hasCoursePattern) {
        console.log(`[IntentClassifier] Topic + course pattern → navigate_course (0.95)`)
        return {
          intent: ChatIntent.NAVIGATE_COURSE,
          confidence: 0.95,
          entities,
        }
      } else if (hasCreateCoursePattern) {
        console.log(`[IntentClassifier] Topic + create course pattern → create_course (0.95)`)
        return {
          intent: ChatIntent.CREATE_COURSE,
          confidence: 0.95,
          entities,
        }
      } else if (hasCreateQuizPattern) {
        console.log(`[IntentClassifier] Topic + create quiz pattern → create_quiz (0.95)`)
        return {
          intent: ChatIntent.CREATE_QUIZ,
          confidence: 0.95,
          entities,
        }
      } else if (hasQuizPattern) {
        console.log(`[IntentClassifier] Topic + quiz pattern → navigate_quiz (0.95)`)
        return {
          intent: ChatIntent.NAVIGATE_QUIZ,
          confidence: 0.95,
          entities,
        }
      } else if (hasExplainPattern) {
        console.log(`[IntentClassifier] Topic + explain pattern → explain_concept (0.90)`)
        return {
          intent: ChatIntent.EXPLAIN_CONCEPT,
          confidence: 0.90,
          entities,
        }
      } else {
        // Topic mentioned with learning/finding intent words → navigate to courses
        const hasLearningIntent = /\b(learn|study|understand|find|looking for|help|need|want|interested in|tutorial|course)\b/i.test(normalizedMessage)
        if (hasLearningIntent) {
          console.log(`[IntentClassifier] Topic + learning keywords → navigate_course (0.88)`)
          return {
            intent: ChatIntent.NAVIGATE_COURSE,
            confidence: 0.88,
            entities,
          }
        }
        
        // Default to course navigation for tech topics
        console.log(`[IntentClassifier] Topic detected → navigate_course (0.85)`)
        return {
          intent: ChatIntent.NAVIGATE_COURSE,
          confidence: 0.85,
          entities,
        }
      }
    }

    // 6. Use NLP classifier for ambiguous cases, fallback to AI
    if (patternMatches.length === 0 || patternMatches[0].confidence < 0.65) {
      console.log(`[IntentClassifier] Low confidence, trying NLP classification`)

      try {
        const nlpResult = await this.nlpClassifier.predict(message)

        // Convert NLP intent to ChatIntent enum
        const intentMap: Record<string, ChatIntent> = {
          'greeting': ChatIntent.OFF_TOPIC,
          'course.search': ChatIntent.NAVIGATE_COURSE,
          'quiz.start': ChatIntent.NAVIGATE_QUIZ,
          'course.create': ChatIntent.CREATE_COURSE,
          'help.general': ChatIntent.GENERAL_HELP,
          'unknown': ChatIntent.GENERAL_HELP, // Map unknown to general help
        }

        const mappedIntent = intentMap[nlpResult.intent] || ChatIntent.GENERAL_HELP

        // If NLP gives high confidence, use it
        if (nlpResult.score >= 0.7) {
          console.log(`[IntentClassifier] NLP classified as: ${mappedIntent} (confidence: ${nlpResult.score})`)
          return {
            intent: mappedIntent,
            confidence: nlpResult.score,
            entities: {
              quantity: 0,
              topics: [], // Could extract from NLP if needed
            },
          }
        }

        console.log(`[IntentClassifier] NLP confidence too low (${nlpResult.score}), using AI classification`)
      } catch (error) {
        console.warn('[IntentClassifier] NLP classification failed:', error)
      }

      // Fallback to OpenAI classification
      return await this.classifyWithAI(message, context)
    }

    // 7. Use highest confidence pattern match
    console.log(`[IntentClassifier] Pattern match: ${patternMatches[0].intent} (confidence: ${patternMatches[0].confidence})`)
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
    const normalizedMessage = message.toLowerCase()

    for (const [intentKey, patterns] of Object.entries(this.patterns)) {
      const intent = intentKey as ChatIntent
      let highestConfidence = 0

      for (const pattern of patterns) {
        if (pattern.test(message)) {
          let confidence = 0.75
          
          if (intent === ChatIntent.NAVIGATE_COURSE) {
            if (/\b(find|show|search|looking for|need|want|help.*find|interested in)\b/i.test(message)) {
              confidence += 0.10
            }
            if (/\b(tutorial|course|learn|study|lesson|class|training)\b/i.test(message)) {
              confidence += 0.08
            }
          } else if (intent === ChatIntent.EXPLAIN_CONCEPT) {
            if (/\b(what|why|how|explain|confused|don't understand)\b/i.test(message)) {
              confidence += 0.08
            }
          } else if (intent === ChatIntent.TROUBLESHOOT) {
            if (/\b(error|bug|broken|not working|can't|unable)\b/i.test(message)) {
              confidence += 0.12
            }
          }
          
          if (pattern.source.length > 70) {
            confidence += 0.08
          } else if (pattern.source.length > 50) {
            confidence += 0.05
          }
          
          highestConfidence = Math.max(highestConfidence, Math.min(confidence, 0.95))
        }
      }

      if (highestConfidence > 0) {
        results.push({ intent, confidence: highestConfidence })
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Extract entities from message
   */
  private extractEntities(
    message: string,
    context?: UserContext
  ): IntentResult['entities'] {
    const entities: IntentResult['entities'] = {
      quantity: 0, // Default value
    }
    const normalizedMessage = message.toLowerCase()

    // Extract quiz types
    const quizTypes = ['mcq', 'multiple choice', 'code', 'coding', 'openended', 'open ended', 'blanks', 'fill in the blanks', 'flashcard', 'flash card', 'ordering']
    for (const type of quizTypes) {
      if (normalizedMessage.includes(type)) {
        entities.quizTypes = entities.quizTypes || []
        const normalizedType = type.replace(/\s+/g, '')
        if (!entities.quizTypes.includes(normalizedType)) {
          entities.quizTypes.push(normalizedType)
        }
      }
    }

    // Extract difficulty
    const difficulties = ['easy', 'beginner', 'basic', 'simple', 'medium', 'intermediate', 'hard', 'difficult', 'advanced', 'expert']
    const difficultyMap: Record<string, string> = {
      'beginner': 'easy',
      'basic': 'easy',
      'simple': 'easy',
      'intermediate': 'medium',
      'difficult': 'hard',
      'advanced': 'hard',
      'expert': 'hard',
    }
    
    for (const diff of difficulties) {
      if (new RegExp(`\\b${diff}\\b`, 'i').test(message)) {
        entities.difficulty = difficultyMap[diff] || diff
        break
      }
    }

    // Extract topics from context
    const topicPatterns = [
      /\b(on|about|for|regarding|related to|covering)\s+([a-zA-Z0-9\s\+\-#]+?)(?=\?|$|\.|,|\s+and\s+|\s+or\s+)/i,
      /\b(learn|study|understand|master)\s+([a-zA-Z0-9\s\+\-#]+?)(?=\?|$|\.|,)/i,
    ]
    
    for (const pattern of topicPatterns) {
      const match = message.match(pattern)
      if (match && match[2]) {
        const topic = match[2].trim()
        if (topic.length > 2) {
          entities.topics = entities.topics || []
          if (!entities.topics.includes(topic)) {
            entities.topics.push(topic)
          }
        }
      }
    }

    // Extract programming languages and tech topics
    const techKeywords = [
      'javascript', 'js', 'python', 'java', 'typescript', 'ts', 'react', 'reactjs',
      'node', 'nodejs', 'node.js', 'angular', 'vue', 'vuejs', 'c\\+\\+', 'cpp',
      'c#', 'csharp', 'ruby', 'go', 'golang', 'rust', 'swift', 'kotlin',
      'php', 'sql', 'mysql', 'postgresql', 'html', 'css', 'sass', 'scss',
      'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp',
      'machine learning', 'ml', 'ai', 'artificial intelligence',
      'data science', 'deep learning', 'neural networks',
      'web development', 'backend', 'frontend', 'front-end', 'back-end',
      'fullstack', 'full-stack', 'devops', 'blockchain', 'mongodb',
      'express', 'django', 'flask', 'spring', 'laravel', 'nextjs', 'next.js',
      'git', 'github', 'api', 'rest', 'graphql', 'redux', 'webpack',
      'tailwind', 'bootstrap', 'jquery', 'flutter', 'react native',
    ]
    
    for (const keyword of techKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i')
      if (regex.test(message)) {
        entities.topics = entities.topics || []
        const cleanKeyword = keyword
          .replace('\\+\\+', '++')
          .replace('\\b', '')
        if (!entities.topics.includes(cleanKeyword)) {
          entities.topics.push(cleanKeyword)
        }
      }
    }

    // Extract quantity/number
    const numberMatch = message.match(/\b(\d+)\s*(questions?|items?|quizz?es?)\b/i)
    if (numberMatch) {
      entities.quantity = parseInt(numberMatch[1], 10)
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
            content: `You are an intent classifier for CourseAI, an educational platform that helps users learn programming and technology.

Classify the user's message into one of these intents:
${Object.values(ChatIntent).join('\n- ')}

Guidelines:
- If the user mentions wanting to learn, find tutorials, or asks about a technology topic → navigate_course
- If they want to test their knowledge or take a quiz → navigate_quiz  
- If they want to create/generate a quiz → create_quiz
- If they want to create/generate a course → create_course
- If they're asking "what is" or "how does X work" → explain_concept
- If they're reporting a problem or error → troubleshoot
- If they're asking about pricing or plans → subscription_info
- If they're asking how to use the platform → general_help
- If it's completely unrelated to learning/education → off_topic

Extract any relevant entities like programming languages, technologies, quiz types, difficulty levels.

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
                  maximum: 1,
                },
                entities: {
                  type: 'object',
                  properties: {
                    courseNames: { 
                      type: 'array', 
                      items: { type: 'string' },
                    },
                    quizTypes: { 
                      type: 'array', 
                      items: { type: 'string' },
                    },
                    topics: { 
                      type: 'array', 
                      items: { type: 'string' },
                    },
                    difficulty: { 
                      type: 'string',
                      enum: ['easy', 'medium', 'hard'],
                    },
                    quantity: {
                      type: 'number',
                    },
                  },
                },
              },
              required: ['intent', 'confidence', 'entities'],
            },
          },
        ],
        function_call: { name: 'classify_intent' },
        max_tokens: 200,
        temperature: 0.1,
      })

      const functionCall = response.choices[0]?.message?.function_call
      if (!functionCall?.arguments) {
        console.warn('[IntentClassifier] AI classification failed, using default')
        return this.getDefaultIntent()
      }

      const result = JSON.parse(functionCall.arguments) as IntentResult
      console.log(`[IntentClassifier] AI classified as: ${result.intent} (confidence: ${result.confidence})`)
      return result
    } catch (error) {
      console.error('[IntentClassifier] AI classification error:', error)
      return this.getDefaultIntent()
    }
  }

  /**
   * Get default intent for fallback
   */
  private getDefaultIntent(): IntentResult {
    return {
      intent: ChatIntent.GENERAL_HELP,
      confidence: 0.50,
      entities: {
        quantity: 0,
      },
    }
  }

  /**
   * Check if query is relevant to platform
   */
  isRelevantQuery(intent: ChatIntent): boolean {
    return intent !== ChatIntent.OFF_TOPIC
  }
}