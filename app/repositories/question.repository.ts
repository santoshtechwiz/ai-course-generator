import { QuizType } from "@/app/types/quiz-types";
import prisma from "@/lib/db";
import { BaseRepository } from "./base.repository";

/**
 * Repository for handling question data operations
 */
export class QuestionRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.userQuizQuestion);
  }

  /**
   * Create multiple questions for a quiz
   */
  async createQuestions(questions: any[], userQuizId: number, type: QuizType) {
    const data = questions.map((question) => {
      switch (type) {
        case "mcq": {
          const q = question as any;

          // Combine correct answer with distractors, then shuffle
          let allOptions = [q.option1, q.option2, q.option3, q.answer]
          // Remove duplicates
          allOptions = Array.from(new Set(allOptions))
          // Add "None of the above" if not already present
          if (allOptions.length < 3) {
            allOptions.push("None of the above")
          }
          const shuffledOptions = allOptions.sort(() => Math.random() - 0.5)

          return {
            question: q.question,
            answer: q.answer,
            options: JSON.stringify(shuffledOptions),
            userQuizId,
            questionType: "mcq" as const,
          }
        }

        case "code": {
          const q = question as any;

          return {
            question: q.question,
            answer: q.correctAnswer,
            options: JSON.stringify(q.options || []),
            codeSnippet: q.codeSnippet ?? null,
            userQuizId,
            questionType: "code" as const,
          }
        }

        case "openended": {
          const q = question as any;

          const questionData = {
            question: q.question,
            answer: q.answer,
            userQuizId,
            questionType: "openended" as const,
          };

          return questionData;
        }

        case "blanks": {
          const q = question as any;

          return {
            question: q.question,
            answer: q.answer,
            userQuizId,
            questionType: "blanks" as const,
          }
        }

        case "flashcard": {
          const q = question as any;

          return {
            question: q.question,
            answer: q.answer,
            userQuizId,
            questionType: "flashcard" as const,
          }
        }

        default:
          throw new Error(`Unsupported quiz type: ${type}`);
      }
    });

    return prisma.userQuizQuestion.createMany({
      data,
    });
  }

  /**
   * Find questions by quiz ID
   */
  async findByQuizId(userQuizId: number) {
    return prisma.userQuizQuestion.findMany({
      where: {
        userQuizId,
      },
      orderBy: {
        id: "asc",
      },
    });
  }

  /**
   * Find open-ended questions with details
   */
  async findOpenEndedQuestionsByQuizId(userQuizId: number) {
    return prisma.userQuizQuestion.findMany({
      where: {
        userQuizId,
        questionType: "openended",
      },
      include: {
        openEndedQuestion: true,
      },
      orderBy: {
        id: "asc",
      },
    });
  }
}
