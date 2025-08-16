import { OpenAIProvider } from "@/lib/ai/openai-provider"

interface MCQQuizRequest {
  title: string
  amount: number
  difficulty: "easy" | "medium" | "hard"
}

interface MCQQuestion {
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
  difficulty: string
  tags: string[]
}

interface MCQQuizResponse {
  questions: MCQQuestion[]
  totalQuestions: number
  difficulty: string
  topic: string
}

export class MCQQuizService {
  private openaiProvider: OpenAIProvider

  constructor() {
    this.openaiProvider = new OpenAIProvider()
  }

  async generateQuiz(request: MCQQuizRequest): Promise<MCQQuizResponse> {
    try {
      const { title, amount, difficulty } = request

      // Create a prompt for MCQ generation
      const prompt = this.createMCQPrompt(title, amount, difficulty)
      
      // Generate quiz using OpenAI
      const response = await this.openaiProvider.createMCQQuiz(prompt, {
        title,
        amount,
        difficulty,
      })

      // Parse and validate the response
      const questions = this.parseMCQResponse(response, amount)

      return {
        questions,
        totalQuestions: questions.length,
        difficulty,
        topic: title,
      }
    } catch (error) {
      console.error("Error generating MCQ quiz:", error)
      throw new Error(`Failed to generate MCQ quiz: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private createMCQPrompt(title: string, amount: number, difficulty: string): string {
    return `Create ${amount} multiple-choice questions about "${title}" at ${difficulty} difficulty level.

Requirements:
- Each question should have 4 options (A, B, C, D)
- Only one correct answer per question
- Include a brief explanation for the correct answer
- Questions should be clear and unambiguous
- Vary the difficulty within the ${difficulty} range
- Include relevant tags for categorization

Format each question as:
Question: [question text]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Correct Answer: [letter]
Explanation: [brief explanation]
Tags: [tag1, tag2, tag3]

Make sure the questions are engaging and test understanding of the topic.`
  }

  private parseMCQResponse(response: string, expectedAmount: number): MCQQuestion[] {
    try {
      // This is a simplified parser - in production, you might want to use a more robust approach
      const questions: MCQQuestion[] = []
      const questionBlocks = response.split(/(?=Question:)/).filter(block => block.trim())

      for (const block of questionBlocks) {
        if (questions.length >= expectedAmount) break

        try {
          const question = this.parseQuestionBlock(block)
          if (question) {
            questions.push(question)
          }
        } catch (error) {
          console.warn("Failed to parse question block:", error)
          continue
        }
      }

      // If parsing failed, generate fallback questions
      if (questions.length === 0) {
        return this.generateFallbackQuestions(expectedAmount)
      }

      return questions.slice(0, expectedAmount)
    } catch (error) {
      console.error("Error parsing MCQ response:", error)
      return this.generateFallbackQuestions(expectedAmount)
    }
  }

  private parseQuestionBlock(block: string): MCQQuestion | null {
    try {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line)
      
      let question = ""
      let options: string[] = []
      let correctAnswer = ""
      let explanation = ""
      let tags: string[] = []

      for (const line of lines) {
        if (line.startsWith("Question:")) {
          question = line.replace("Question:", "").trim()
        } else if (line.match(/^[A-D]\)/)) {
          const option = line.replace(/^[A-D]\)\s*/, "").trim()
          options.push(option)
        } else if (line.startsWith("Correct Answer:")) {
          correctAnswer = line.replace("Correct Answer:", "").trim()
        } else if (line.startsWith("Explanation:")) {
          explanation = line.replace("Explanation:", "").trim()
        } else if (line.startsWith("Tags:")) {
          const tagsStr = line.replace("Tags:", "").trim()
          tags = tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag)
        }
      }

      if (question && options.length === 4 && correctAnswer) {
        return {
          question,
          options,
          correctAnswer,
          explanation,
          difficulty: "medium",
          tags: tags.length > 0 ? tags : ["general"],
        }
      }

      return null
    } catch (error) {
      console.warn("Error parsing individual question:", error)
      return null
    }
  }

  private generateFallbackQuestions(amount: number): MCQQuestion[] {
    const fallbackQuestions: MCQQuestion[] = []
    
    for (let i = 1; i <= amount; i++) {
      fallbackQuestions.push({
        question: `Sample question ${i}?`,
        options: [
          `Option A for question ${i}`,
          `Option B for question ${i}`,
          `Option C for question ${i}`,
          `Option D for question ${i}`,
        ],
        correctAnswer: `Option A for question ${i}`,
        explanation: `This is a fallback question ${i}`,
        difficulty: "medium",
        tags: ["fallback", "sample"],
      })
    }

    return fallbackQuestions
  }
}
