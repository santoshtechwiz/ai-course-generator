import { LLMChain } from "langchain/chains"
import { OpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"


export interface Recommendation {
  type: "next" | "review" | "practice"
  message: string
  courseId: number
  chapterId: number
  slug: string
}

export class LangChain {
  private llm: OpenAI
  private chain: LLMChain

  constructor() {
    this.llm = new OpenAI({apiKey:process.env.OPENAI_API_KEY })
    const prompt = new PromptTemplate({
      template: `Analyze the following user data and provide personalized course and quiz recommendations. 
      For each recommendation, include the type (next, review, or practice), a message, courseId, chapterId, and slug.

      User Data:
      {userData}

      Provide 3 recommendations in the following format:
      1. Type: [type]
         Message: [message]
         CourseId: [courseId]
         ChapterId: [chapterId]
         Slug: [slug]
      
      2. ...
      3. ...
      `,
      inputVariables: ["userData"],
    })
    this.chain = new LLMChain({ llm: this.llm, prompt })
  }

  async analyzeUserData(userData: any): Promise<Recommendation[]> {
    const result = await this.chain.call({
      userData: JSON.stringify(userData, null, 2),
    })

    return this.parseRecommendations(result.text)
  }

  private parseRecommendations(text: string): Recommendation[] {
    const recommendations: Recommendation[] = []
    const regex =
      /(\d+)\.\s+Type:\s+(\w+)\s+Message:\s+(.*?)\s+CourseId:\s+(\d+)\s+ChapterId:\s+(\d+)\s+Slug:\s+([\w-]+)/gs
    let match

    while ((match = regex.exec(text)) !== null) {
      recommendations.push({
        type: match[2].toLowerCase() as "next" | "review" | "practice",
        message: match[3],
        courseId: Number.parseInt(match[4]),
        chapterId: Number.parseInt(match[5]),
        slug: match[6],
      })
    }

    return recommendations
  }
}

