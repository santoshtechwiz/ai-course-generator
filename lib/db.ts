
import { MultipleChoiceQuestion, QuizType,OpenEndedQuestion, CodeChallenge } from '@/app/types';
import { Prisma, PrismaClient } from '@prisma/client';

// Create a global object to store the Prisma client instance (for Next.js Fast Refresh)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Use Neon serverless driver instead of the default Node.js driver
const databaseUrl = process.env.DATABASE_URL!;


export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {

      db: {
        url: databaseUrl,
      },
    },
  });

// Avoid creating multiple Prisma instances in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;



// Create a new course
export const createCourse = async (data: Prisma.CourseCreateInput) => {
  try {
    return await prisma.course.create({
      data,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    throw error;
  }
};





// Get a single course by slug
export const getCourseBySlug = async (slug: string) => {
  try {
    return await prisma.course.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error("Error fetching course by slug:", error);
    throw error;
  }
};

// Update a course by ID
export const updateCourse = async (id: number, data: Prisma.CourseUpdateInput) => {
  try {
    return await prisma.course.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    throw error;
  }
};

// Delete a course by ID
export const deleteCourse = async (id: number) => {
  try {
    return await prisma.course.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
};






// Check if a course exists by slug
export const courseExistsBySlug = async (slug: string) => {
  try {
    const course = await prisma.course.findUnique({
      where: { slug },
    });
    return course ? true : false;
  } catch (error) {
    console.error("Error checking if course exists by slug:", error);
    throw error;
  }
};




// Create a new user
export const createUser = async (data: Prisma.UserCreateInput) => {
  try {
    return await prisma.user.create({
      data,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Get all users
export const getUsers = async () => {
  try {
    return await prisma.user.findMany();
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Get a single user by ID
export const getUserById = async (id: string) => {
  try {
    return await prisma.user.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
};

// Update a user by ID
export const updateUser = async (id: string, data: Prisma.UserUpdateInput) => {
  try {
    return await prisma.user.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Delete a user by ID
export const deleteUser = async (id: string) => {
  try {
    return await prisma.user.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};




export async function slugToId(slug: string): Promise<number | null> {
  try {
    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    });
    return course?.id || null;
  } catch (error) {
    console.error(`Error fetching ID for slug ${slug}:`, error);
    return null;
  }
}
export async function fetchSlug(type: "course" | "mcq" | 'openended', id: string): Promise<string | null> {
  try {
    if (type === "course") {
      const course = await prisma.course.findUnique({
        where: { id: parseInt(id, 10) },
        select: { slug: true },
      });
      return course?.slug || null;
    }
    if (type === "mcq" || type === "openended") {
      const quiz = await prisma.userQuiz.findUnique({
        where: { id: parseInt(id, 10) },
        select: { slug: true },
      });
      return quiz?.slug || null;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching slug for ${type} with ID ${id}:`, error);
    return null;
  }
}
export async function getUserWithCourses(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        courses: {
          include: {
            courseUnits: true,
          },
        },
        subscriptions: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    const coursesWithProgress = user.courses.map((course) => {
      const totalUnits = course.courseUnits.length
      const completedUnits = course.courseUnits.filter((unit) => unit.isCompleted).length
      const progress = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0

      return {
        id: course.id,
        name: course.name,
        progress,
      }
    })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      credits: user.credits,
      courses: coursesWithProgress,
      subscription: user.subscriptions ? {
        userType: user.subscriptions.userId,
        stripeCurrentPeriodEnd: user.subscriptions.currentPeriodEnd,
      } : null,
    }
  } catch (error) {
    console.error("Error fetching user data:", error)
    throw error
  }
}







export async function fetchCourses(filters = {}, userId?: string) {
  const baseQuery = {
    where: filters,
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      averageRating: true,
      slug: true,
      userId: true,
      courseUnits: {
        select: {
          _count: {
            select: { chapters: true }
          },
          chapters: {
            select: {
              _count: {
                select: { questions: true }
              }
            }
          }
        }
      }
    },
  }

  const query = userId
    ? { ...baseQuery, where: { ...baseQuery.where, userId } }
    : { ...baseQuery, where: { ...baseQuery.where, isPublic: true } as Prisma.CourseWhereInput };

  const courses = await prisma.course.findMany({
    ...query,
    select: {
      ...query.select,
      courseUnits: {
        select: {
          _count: true,
          chapters: {
            select: {
              _count: true,
            },
          },
        },
      },
    },
  });

  return courses.map((course) => ({
    id: course.id.toString(),
    name: course.name,
    description: course.description || "No description available",
    image: course.image,
    rating: course.averageRating,
    slug: course.slug || "",
    unitCount: course.courseUnits.length,
    lessonCount: course.courseUnits.reduce((acc, unit) => acc + unit._count.chapters, 0),
    quizCount: course.courseUnits.reduce((acc, unit) =>
      acc + unit.chapters.reduce((chapterAcc, chapter) => chapterAcc + chapter._count.courseQuizzes, 0), 0
    ),
    userId: course.userId,
  }))
}

export async function getRandomQuestions(count: number = 5) {
  const randomQuestions = await prisma.userQuiz.findMany({
    where: {
      quizType: "openended"
    },
    select: {
      id: true,
      slug: true,
      topic: true,
      _count: {
        select: {
          questions: true,
        },
      },
      questions: {
        select: {
          question: true,
        },
      },
    },
    orderBy: {
      id: 'asc'
    },
    take: count
  });

  return randomQuestions.map(q => ({
    question: q.questions.map(question => question.question).join(', '),
    slug: q.slug,
    topic: q.topic,
    count: q._count.questions,
  }));
}


export async function clearExpiredSessions() {
  const now = new Date()
  await prisma.session.deleteMany({
    where: {
      OR: [
        { expires: { lt: now } },
      ],
    },
  })
}




export async function fetchRandomQuizzes(count: number = 3) {
  try {
    const quizzes = await prisma.userQuiz.findMany({
      select: {
        id: true,
        topic: true,
        slug: true,
        quizType: true,
        difficulty: true,
        bestScore: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    // Shuffle the quizzes and take the requested count
    const shuffled = quizzes.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count) || [];
  } catch (error) {
    return [];

  }
}

export async function createUserQuiz(userId: string, topic: string, type: string, slug: string) {
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    try {
      return await prisma.userQuiz.create({
        data: {
          quizType: type,
          timeStarted: new Date(),
          userId,
          isPublic: false,
          topic,
          slug: uniqueSlug,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      } else {
        throw error;
      }
    }
  }
}

export async function createQuestions(questions: MultipleChoiceQuestion[] | OpenEndedQuestion[] |CodeChallenge[], userQuizId: number, type: QuizType) {
  const data = questions.map((question) => {
    if (type === 'mcq') {
      const mcqQuestion = question as MultipleChoiceQuestion;
      const options = [mcqQuestion.answer, mcqQuestion.option1, mcqQuestion.option2, mcqQuestion.option3].sort(() => Math.random() - 0.5);
      return {
        
        question: mcqQuestion.question,
        answer: mcqQuestion.answer,
        options: JSON.stringify(options),
        userQuizId,
        questionType: "mcq" as const,
      };

    } 
    else if (type === 'code') {
      const codingQuestion = question as CodeChallenge;
      
      return {
        
        question: codingQuestion.question,
        answer: codingQuestion.correctAnswer,
        options: JSON.stringify(codingQuestion.options),
        codeSnippet: codingQuestion.codeSnippet === undefined ? null : codingQuestion.codeSnippet,
        userQuizId,
        questionType: "code" as const,
      };
    }
    else {
      const openEndedQuestion = question as OpenEndedQuestion;
      return {
        question: openEndedQuestion.question,
        answer: openEndedQuestion.answer,
        userQuizId,
        questionType: "openended" as const,
      };
    }
  });

  await prisma.userQuizQuestion.createMany({ data });
}

export async function updateTopicCount(topic: string) {
  return prisma.topicCount.upsert({
    where: { topic },
    create: { topic, count: 1 },
    update: { count: { increment: 1 } },
  });
}
export async function updateUserCredits(userId: string, type: QuizType): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscriptions: true },
  });

  if (!user) {
    throw new Error(`User with id ${userId} not found`);
  }

  if (user.credits <= 0) {
    throw new Error("User does not have enough credits");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: 1 } },
  });
}