import { AIProvider } from "../interfaces";
import { defaultAIProvider } from "../provider-factory";

/**
 * Represents a course learning objective
 */
export interface LearningObjective {
  title: string;
  description: string;
}

/**
 * Represents a key concept in a course
 */
export interface KeyConcept {
  concept: string;
  explanation: string;
}

/**
 * Represents a practical exercise for a course
 */
export interface PracticalExercise {
  title: string;
  description: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  estimatedTimeMinutes: number;
}

/**
 * Complete course outline structure
 */
export interface CourseOutline {
  title: string;
  description: string;
  targetAudience: string[];
  prerequisiteKnowledge: string[];
  learningObjectives: LearningObjective[];
  keyConcepts: KeyConcept[];
  practicalExercises: PracticalExercise[];
  estimatedDurationHours: number;
  recommendedResources: string[];
}

/**
 * Parameters for generating a course outline
 */
export interface CourseOutlineParams {
  topic: string;
  skillLevel?: "beginner" | "intermediate" | "advanced" | "all-levels";
  focusAreas?: string[];
  userType?: string;
}

/**
 * Generator for comprehensive course outlines
 */
export class CourseOutlineGenerator {
  private aiProvider: AIProvider;

  constructor(aiProvider: AIProvider = defaultAIProvider) {
    this.aiProvider = aiProvider;
  }

  /**
   * Generate a comprehensive course outline for a given topic
   * 
   * @param params Parameters for generating the course outline
   * @returns A structured course outline
   */
  async generateCourseOutline(params: CourseOutlineParams): Promise<CourseOutline> {
    const { topic, skillLevel = "all-levels", focusAreas = [], userType = "FREE" } = params;

    const focusAreasText = focusAreas.length > 0 
      ? `with particular focus on: ${focusAreas.join(", ")}` 
      : "";

    const functions = [
      {
        name: "createCourseOutline",
        description: "Create a comprehensive course outline with learning objectives, key concepts, and practical exercises",
        parameters: {
          type: "object",
          properties: {
            title: { 
              type: "string", 
              description: "Engaging title for the course" 
            },
            description: { 
              type: "string", 
              description: "Comprehensive description of what the course covers (150-250 words)" 
            },
            targetAudience: { 
              type: "array", 
              items: { type: "string" }, 
              description: "Who this course is designed for" 
            },
            prerequisiteKnowledge: { 
              type: "array", 
              items: { type: "string" }, 
              description: "Prior knowledge required before taking this course" 
            },
            learningObjectives: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" }
                },
                required: ["title", "description"]
              }
            },
            keyConcepts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  concept: { type: "string" },
                  explanation: { type: "string" }
                },
                required: ["concept", "explanation"]
              }
            },
            practicalExercises: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  difficultyLevel: { 
                    type: "string", 
                    enum: ["beginner", "intermediate", "advanced"] 
                  },
                  estimatedTimeMinutes: { type: "number" }
                },
                required: ["title", "description", "difficultyLevel", "estimatedTimeMinutes"]
              }
            },
            estimatedDurationHours: { type: "number" },
            recommendedResources: { 
              type: "array", 
              items: { type: "string" }, 
              description: "Books, websites, videos, tools, etc. that complement the course" 
            }
          },
          required: [
            "title", "description", "targetAudience", "prerequisiteKnowledge", 
            "learningObjectives", "keyConcepts", "practicalExercises", 
            "estimatedDurationHours", "recommendedResources"
          ]
        }
      }
    ];

    const result = await this.aiProvider.generateChatCompletion({
      model: this.getModelForUserType(userType),
      messages: [
        {
          role: "system",
          content: "You are an expert educational designer who creates comprehensive, well-structured course outlines. Your outlines are detailed, pedagogically sound, and include clear learning objectives, key concepts, and practical exercises."
        },
        {
          role: "user",
          content: `Create a comprehensive course outline for a ${skillLevel} level course on "${topic}" ${focusAreasText}.
          
Include:
1. An engaging course title and description
2. Target audience and prerequisite knowledge
3. 4-6 concrete learning objectives with descriptions
4. 8-12 key concepts with brief explanations
5. 3-5 practical exercises with difficulty levels and time estimates
6. Estimated total course duration in hours
7. Recommended resources for further learning

Make the outline comprehensive, practical, and focused on building real-world skills.`
        }
      ],
      functions: functions,
      functionCall: { name: "createCourseOutline" }
    });

    if (!result.functionCall?.arguments) {
      throw new Error("Failed to generate course outline");
    }

    try {
      return JSON.parse(result.functionCall.arguments);
    } catch (error) {
      console.error("Error parsing course outline:", error);
      throw new Error("Failed to parse course outline response");
    }
  }

  /**
   * Get the appropriate AI model based on user type
   * 
   * @param userType The user's subscription type
   * @returns The model name to use
   */
  private getModelForUserType(userType: string): string {
    switch (userType) {
      case "PREMIUM":
      case "ULTIMATE":
        return process.env.AI_MODEL_PREMIUM || "gpt-4-1106-preview";
      case "BASIC":
        return process.env.AI_MODEL_BASIC || "gpt-3.5-turbo-1106";
      case "FREE":
      default:
        return process.env.AI_MODEL_FREE || "gpt-3.5-turbo-1106";
    }
  }
}

/**
 * Utility function to generate a course outline using the default AI provider
 * 
 * @param params Parameters for generating the course outline
 * @returns A structured course outline
 */
export async function generateCourseOutline(params: CourseOutlineParams): Promise<CourseOutline> {
  const generator = new CourseOutlineGenerator();
  return await generator.generateCourseOutline(params);
}
