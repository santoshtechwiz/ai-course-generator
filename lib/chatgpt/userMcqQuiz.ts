import type { Quiz } from "@/app/types/types"
import { defaultAIProvider } from "@/lib/ai"

/**
 * Generate multiple choice questions for user input
 * 
 * @param title The topic to generate questions about
 * @param amount The number of questions to generate
 * @param difficulty The difficulty level of the questions
 * @param userType The user type to determine AI model
 * @returns An array of MCQ questions
 */
export const generateMcqForUserInput = async (title: string, amount: number, difficulty = "hard", userType: string) => {
  try {
    return await defaultAIProvider.generateMCQQuiz({
      title,
      amount,
      difficulty,
      userType
    });
  } catch (error) {
    console.error("Error generating MCQ quiz:", error);
    throw new Error(`Failed to generate MCQ quiz: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate open-ended questions
 * 
 * @param title The topic to generate questions about
 * @param amount The number of questions to generate
 * @param difficulty The difficulty level of the questions
 * @param userType The user type to determine AI model
 * @returns A quiz with open-ended questions
 */
export const generateOpenEndedQuiz = async (
  title: string,
  amount = 5,
  difficulty = "medium",
  userType = "FREE",
): Promise<Quiz> => {
  try {
    return await defaultAIProvider.generateOpenEndedQuiz({
      title,
      amount,
      difficulty,
      userType
    });
  } catch (error) {
    console.error("Error generating open-ended quiz:", error);
    throw new Error(`Failed to generate open-ended quiz: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate fill-in-the-blanks questions
 * 
 * @param title The topic to generate questions about
 * @param amount The number of questions to generate
 * @param userType The user type to determine AI model
 * @returns A quiz with fill-in-the-blanks questions
 */
export const generateOpenEndedFillIntheBlanks = async (
  title: string,
  amount: number,
  userType = "FREE",
): Promise<Quiz> => {
  try {
    return await defaultAIProvider.generateFillInTheBlanksQuiz({
      title,
      amount,
      userType
    });
  } catch (error) {
    console.error("Error generating fill-in-the-blanks quiz:", error);
    throw new Error(`Failed to generate fill-in-the-blanks quiz: ${error instanceof Error ? error.message : String(error)}`);
  }
}
