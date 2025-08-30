import prisma from "@/lib/db"
import { QuizType } from "@/lib/utils"


export interface RecommendedItem {
  id: string
  title: string
  type: "course" | "quiz"
  image: string
  slug: string
  description: string
  quizType?: QuizType
}

/**
 * Get a list of recommended courses and quizzes for the 404 page
 * @param limit The maximum number of items to return (default: 3)
 * @returns Array of recommended items (courses and quizzes)
 */
export async function getRecommendedItems(limit: number = 3): Promise<RecommendedItem[]> {
  try {
    // Get popular courses
    const courses = await prisma.course.findMany({
      where: {
        isPublic: true,
      },
      orderBy: {
        viewCount: "desc",
      },
      take: Math.ceil(limit / 2),
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
        description: true,
      }
    });

    // Get popular quizzes
    const quizzes = await prisma.userQuiz.findMany({
      where: {
        isPublic: true,
      },
      orderBy: {
        lastAttempted: "desc", // Order by most recently attempted
      },
      take: Math.floor(limit / 2),
      select: {
        id: true,
        title: true,
        slug: true,
        quizType: true, // For description
      }
    });

    // Combine and format the results
    const courseItems: RecommendedItem[] = courses.map(course => ({
      id: String(course.id), // Convert number to string to match interface
      title: course.title,
      type: "course",
      image: course.image || "/images/course-placeholder.jpg",
      slug: course.slug || "",
      description: course.description || "Learn more about this course",
    }));

    const quizItems: RecommendedItem[] = quizzes.map(quiz => ({
      id: String(quiz.id), // Convert number to string to match interface
      title: quiz.title,
      type: "quiz",
      image: "/images/quiz-placeholder.jpg", // Default image for quizzes
      slug: quiz.slug,
      description: `${quiz.title} - ${quiz.quizType || "Interactive"} Quiz`,
      quizType: quiz.quizType as QuizType,
    }));

    // Shuffle and return the combined results
    return shuffleArray([...courseItems, ...quizItems]).slice(0, limit);
  } catch (error) {
    console.error("Error fetching recommended items:", error);
    return [];
  }
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param array The array to shuffle
 * @returns The shuffled array
 */
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
