
import { PrismaClient, Prisma } from '@prisma/client';
import { getAuthSession } from './authOptions';
import { Course, FullCourseType, QuizListItem, QuizWithQuestionsAndTags,  } from '@/app/types';
import axios from 'axios';




const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [ "info", "warn", "error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

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

// Get all courses
export const getCourses = async (slug: string) => {
  try {
    const course = await prisma.course.findUnique({
      where: {
        slug: slug, // Querying by slug instead of id
      },
      include: {
        courseUnits: {
          include: {
            chapters: true, // Ensure the chapter relationship is included
          },
        },
      },
    });
    return course;
  } catch (error) {
    console.error("Error fetching courses:", error);

  }
  return null;
};

export async function getPublicQuizzes() {
  try {
    const quizzes = await prisma.userQuiz.findMany({
      select: {
        id: true,
        topic: true,
        slug: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
      where: { isPublic: true },
      take: 10,
    });

    return quizzes.map((quiz) => ({
      id: quiz.id,
      topic: quiz.topic,
      totalQuestions: quiz._count.questions,
      slug: quiz.slug || "",
    }));
  } catch (error) {
    console.error("Error fetching public quizzes:", error);
    return [];
  }
}

// Fetch course details
export async function getCourseDetails(): Promise<any[]> {
  const courses = await prisma.course.findMany({
    orderBy: { id: "asc" },
    where: { isPublic: true },
    select: {
      id: true,
      slug: true,
      name: true,
      category: { select: { name: true } },
      courseUnits: {
        select: {
          chapters: {
            select: { id: true },
          },
        },
      },
    },
    take: 5,
  });

  // Map through courses to structure the result
  return courses.map((course) => {
    const totalUnits = (course.courseUnits || []).length;
    const totalChapters = (course.courseUnits || []).reduce(
      (sum: number, section: { chapters: { id: number }[] }) => sum + section.chapters.length,
      0
    );

    return {
      id: course.id,
      courseName: course.name,
      totalUnits,
      totalChapters,
      category: course.category?.name || null,
      slug: course.slug || "",
    };
  });
}

// Get a single course by ID
export const getCourseById = async (id: number) => {
  try {
    return await prisma.course.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Error fetching course by ID:", error);
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
    if(type === "mcq" || type === "openended") {
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






export async function getCourse(slug: string): Promise<Course | null> {
  return await prisma.course.findFirst({
    where: { slug },
    include: {
      courseUnits: {
        include: {
          chapters: true,
        },
      },
      courseProgress: {
        include: {
          user: true,
        },
      },
    },
  });
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
        { lastUsed: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } }, // 30 days
      ],
    },
  })
}



export async function getCourseData(slug: string): Promise<FullCourseType | null> {
  const course = await prisma.course.findFirst({
    where: { slug },
    include: {
      category: true,
      courseUnits: {
        include: {
          chapters: {
            include: {
              courseQuizzes: true,
            },
          },
        },
      },
      courseProgress: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!course) return null;

  // Fetch quiz attempts for all questions in the course
  const quizAttempts = await prisma.userQuizAttempt.findMany({
    where: {
      userQuiz: {
        questions: {
          some: {
            userQuizId: course.id,
          },
        },
      },
    },
    include: {
      user: true,
      userQuiz: {
        include: {
          questions: true,
        },
      },
      attemptQuestions: true,
    },
  });

  const fullCourse: FullCourseType = {
    
    ...course,
    courseUnits: course.courseUnits.map(unit => ({
      ...unit,
      chapters: unit.chapters.map(chapter => ({
        ...chapter,
        questions: chapter.courseQuizzes.map(question => ({
          ...question,
          attempts: quizAttempts
            .filter(attempt => attempt.userQuiz.questions.some(q => q.id === question.id))
            .map(attempt => ({
              ...attempt,
              attemptQuestions: attempt.attemptQuestions.filter(aq => aq.questionId === question.id),
            })),
        })),
      })),
    })),
  };

  return fullCourse;
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



export async function getQuizzes(): Promise<QuizListItem[]> {
  try {
    const quizzes: QuizWithQuestionsAndTags[] = await prisma.userQuiz.findMany({
      include: {
        questions: true,
        
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return quizzes.map(
      (quiz): QuizListItem => ({
        id: quiz.id,
        topic: quiz.topic,
        slug: quiz.slug,
        questionCount: quiz.questions.length,
        questions: quiz.questions,
        isPublic: quiz.isPublic ?? false,
        quizType: quiz.quizType,
        tags: []
      }),
    )
  } catch (error) {
    console.error("Failed to fetch quizzes:", error)
    return []
  }
}