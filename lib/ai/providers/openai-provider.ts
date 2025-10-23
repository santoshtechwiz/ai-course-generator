import { OpenAI } from "openai";
import https from "https";
import {
  AIProvider,
  ChatCompletionParams,
  ChatCompletionResult,
  QuizGenerationParams,
  mapToOpenAIMessage
} from "../interfaces";
import { Quiz, CodeChallenge } from "@/app/types/types";
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
      dangerouslyAllowBrowser: true, // Removed for server-side use
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
   * Generate coding MCQ questions using OpenAI
   * Supports standard code interpretation, fill-in-the-blank syntax, and concept-based questions
   */
  async generateCodingMCQs(
    language: string,
    title: string,
    difficulty: string,
    amount: number,
    userType: string = "FREE"
  ): Promise<CodeChallenge[]> {
    try {
      const model = this.getAIModel(userType);
      
      // Define difficulty-specific guidance
      const difficultyGuidance = {
        easy: {
          description: "Basic syntax and fundamental concepts",
          examples: "simple loops, conditionals, basic data structures, common methods",
          codeComplexity: "5-10 lines of straightforward code",
        },
        medium: {
          description: "Intermediate concepts requiring understanding of multiple features",
          examples: "array/object manipulation, closures, promises, async/await, error handling",
          codeComplexity: "10-20 lines with moderate complexity",
        },
        hard: {
          description: "Advanced topics requiring deep understanding",
          examples: "complex algorithms, design patterns, performance optimization, edge cases, advanced language features",
          codeComplexity: "15-30 lines with sophisticated logic",
        },
      };

      const guidance = difficultyGuidance[difficulty.toLowerCase() as keyof typeof difficultyGuidance] || difficultyGuidance.medium;

      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are an expert ${language} programming instructor who creates high-quality coding quiz questions. You understand how to assess programming knowledge at different difficulty levels and create realistic, practical coding scenarios that test actual programming skills. Your questions should be clear, unambiguous, and based on real-world coding patterns.`,
          },
          {
            role: "user",
            content: `Generate ${amount} ${difficulty}-level multiple-choice coding questions for ${language} on the topic: "${title}".

DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
- Focus: ${guidance.description}
- Topics: ${guidance.examples}
- Code Complexity: ${guidance.codeComplexity}

QUESTION DISTRIBUTION:
- 70% standard code interpretation questions (predict output, identify behavior, find bugs)
- 20% fill-in-the-blank syntax questions (missing keywords, operators, expressions)
- 10% concept-based questions (no code snippet needed)

QUALITY REQUIREMENTS FOR ${difficulty.toUpperCase()} LEVEL:

${difficulty.toLowerCase() === 'easy' ? `
EASY Questions should:
- Use simple, clear syntax without tricks
- Test basic understanding of language features
- Have obvious incorrect options
- Focus on fundamental concepts (variables, loops, conditionals, basic functions)
- Use short, readable code snippets (5-10 lines max)
- Avoid edge cases or tricky scenarios
Example: "What will this simple loop print?" with straightforward iteration
` : ''}

${difficulty.toLowerCase() === 'medium' ? `
MEDIUM Questions should:
- Combine multiple concepts in one question
- Test understanding of common patterns and best practices
- Require careful code reading and logic tracing
- Include realistic scenarios developers encounter
- Use moderate code complexity (10-20 lines)
- Have plausible distractors that test common misconceptions
Example: "What happens when this async function encounters an error?" or "How does closure capture work here?"
` : ''}

${difficulty.toLowerCase() === 'hard' ? `
HARD Questions should:
- Test deep understanding of language mechanics
- Include edge cases, performance implications, or subtle behaviors
- Require analysis of complex interactions between features
- Challenge experienced developers
- Use sophisticated code patterns (15-30 lines)
- Have subtle differences between options that require expertise
Example: "What is the memory behavior of this recursive implementation?" or "How does the event loop handle these nested promises?"
` : ''}

FORMAT SPECIFICATIONS:

For STANDARD questions (70%):
- question: Clear, specific question about the code (e.g., "What will be logged?", "What is the output?", "What happens when...?")
- codeSnippet: Well-formatted, runnable ${language} code
- options: Four distinct, realistic options
  * For output questions: Exact string/number values (e.g., "42", "undefined", "Hello World")
  * For behavior questions: Clear text descriptions (e.g., "Throws an error", "Returns null")
  * Keep options SHORT and readable - NO multi-line code blocks in options
  * Use inline code format for short expressions: \`variable\`, \`true\`, \`null\`
- correctAnswer: The precise correct option (must match exactly)
- questionType: "standard"

For FILL-IN-THE-BLANK questions (20%):
- question: "What keyword/expression completes this code to achieve [specific goal]?"
- codeSnippet: Code with blank marked as '____' or '/* blank */'
- options: Four SHORT, syntactically valid options
  * Single keywords: \`const\`, \`await\`, \`return\`, \`async\`
  * Short operators: \`===\`, \`!==\`, \`&&\`, \`||\`
  * Brief expressions: \`i++\`, \`arr.length\`, \`obj.key\`
  * NO full statements or multi-line code - keep to 1-3 tokens max
- correctAnswer: The only option that makes the code work correctly
- questionType: "fill-in-the-blank"

For CONCEPT questions (10%):
- question: Clear conceptual question about ${language} on topic "${title}"
- codeSnippet: null
- options: Four distinct theoretical text answers (plain English descriptions)
- correctAnswer: The technically correct option
- questionType: "standard"

CRITICAL RULES:
1. correctAnswer MUST exactly match one option (character-for-character)
2. All options must be distinct and realistic for the difficulty level
3. Code must be syntactically valid ${language}
4. Focus on practical, real-world coding scenarios
5. Distractors should test common mistakes at this difficulty level
6. Questions should be unambiguous with one clear correct answer
7. **OPTIONS FORMATTING RULES**:
   - Keep ALL options SHORT (max 50 characters preferred, 100 absolute max)
   - For code elements in options, use inline format: backticks or simple text
   - NEVER put multi-line code in options - that goes in codeSnippet only
   - For fill-in-blank: options should be 1-3 tokens (keywords, operators, short expressions)
   - For output questions: exact literal values like "42", "[1,2,3]", "undefined"
   - For behavior questions: concise descriptions like "Throws TypeError", "Returns undefined"
   - Each option must be a SINGLE line of text that displays cleanly

Return format: Array named "quizzes" with ${amount} questions.`,
          },
        ],
        functions: [
          {
            name: "create_coding_mcqs",
            description: `Generate ${difficulty}-level ${language} coding MCQ questions`,
            parameters: {
              type: "object",
              properties: {
                quizzes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { 
                        type: "string",
                        description: "Clear question without code (code goes in codeSnippet)"
                      },
                      codeSnippet: { 
                        type: ["string", "null"],
                        description: "Valid code snippet or null for concept questions"
                      },
                      options: {
                        type: "array",
                        items: { type: "string" },
                        minItems: 4,
                        maxItems: 4,
                        description: "Four distinct options, one correct"
                      },
                      correctAnswer: { 
                        type: "string",
                        description: "Must exactly match one of the options"
                      },
                      questionType: {
                        type: "string",
                        enum: ["standard", "fill-in-the-blank"],
                        description: "Type of question"
                      },
                    },
                    required: [
                      "question",
                      "codeSnippet",
                      "options",
                      "correctAnswer",
                      "questionType",
                    ],
                  },
                  minItems: amount,
                  maxItems: amount,
                },
              },
              required: ["quizzes"],
            },
          },
        ],
        function_call: { name: "create_coding_mcqs" },
      });

      const functionCall = response.choices[0].message.function_call;
      if (!functionCall || !functionCall.arguments) {
        throw new Error("Function call failed or arguments missing.");
      }

      const parsed = JSON.parse(functionCall.arguments) as {
        quizzes: CodeChallenge[];
      };

      return parsed.quizzes.map((q) => ({
        question: q.question,
        codeSnippet: q.codeSnippet,
        options: q.options,
        correctAnswer: q.correctAnswer,
        language: language,
        questionType: q.questionType,
      }));
    } catch (error) {
      console.error("Coding MCQ generation failed:", error);
      throw error;
    }
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

// ============= Standalone Functions for Testing =============

/**
 * Standalone function to generate open-ended quiz
 * Creates an OpenAI provider instance and calls the method
 */
export async function generateOpenEndedQuiz(params: QuizGenerationParams): Promise<Quiz> {
  const provider = new OpenAIProvider();
  return provider.generateOpenEndedQuiz(params);
}

/**
 * Standalone function to generate fill-in-the-blanks quiz
 * Creates an OpenAI provider instance and calls the method
 */
export async function generateFillInTheBlanksQuiz(params: QuizGenerationParams): Promise<Quiz> {
  const provider = new OpenAIProvider();
  return provider.generateFillInTheBlanksQuiz(params);
}

/**
 * Standalone function to generate coding MCQs
 * Creates an OpenAI provider instance and calls the method
 */
export async function generateCodingMCQs(
  language: string,
  title: string,
  difficulty: string,
  amount: number,
  userType: string = "FREE"
): Promise<CodeChallenge[]> {
  const provider = new OpenAIProvider();
  return provider.generateCodingMCQs(language, title, difficulty, amount, userType);
}
