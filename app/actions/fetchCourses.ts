
'use server'

import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function fetchCourses(filters = {}, userId?: string) {
  const baseQuery = {
    where: filters,
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      
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

  const course = await prisma.course.findFirst({
    ...query,
    select: {
      ...query.select,
      ratings: {
      select: { rating: true }
      },
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

  if (!course) {
    return null;
  }

  const courses = [course];

  return courses.map(course=> ({
    id: course.id.toString(),
    name: course.name,
    description: course.description || "No description available",
    image: course.image,
    rating: course.ratings[0]?.rating || 0,
    slug: course.slug || "",
    unitCount: course.courseUnits.length,
    lessonCount: course.courseUnits.reduce((acc, unit) => acc + unit._count.chapters, 0),
    quizCount: course.courseUnits.reduce((acc, unit) =>
      acc + unit.chapters.reduce((chapterAcc, chapter) => chapterAcc + chapter._count.courseQuizzes, 0), 0
    ),
    userId: course.userId,
  }))
}
