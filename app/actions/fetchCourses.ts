
'use server'
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

  return courses.map((course: { id: { toString: () => any; }; name: any; description: any; image: any; averageRating: any; slug: any; courseUnits: any[]; userId: any; }) => ({
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
