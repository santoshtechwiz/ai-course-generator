'use server'

import prisma from "@/lib/db"
import { Prisma } from "@prisma/client"
import { cache } from "react"

export const fetchCourses = cache(async (filters = {}, userId?: string) => {
  try {
    const baseQuery = {
      where: userId 
        ? { ...filters, userId } 
        : { ...filters, isPublic: true } as Prisma.CourseWhereInput,
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        slug: true,
        userId: true,
        categoryId: true,
        ratings: {
          select: {
            rating: true
          }
        },
        courseUnits: {
          select: {
            id: true,
            _count: {
              select: {
                chapters: true
              }
            },
            chapters: {
              select: {
                id: true,
                _count: {
                  select: {
                    courseQuizzes: true
                  }
                }
              }
            }
          }
        }
      }
    }

    const courses = await prisma.course.findMany(baseQuery)

    return courses.map(course => ({
      id: course.id.toString(),
      name: course.name,
      description: course.description || "No description available",
      image: course.image,
      rating: course.ratings[0]?.rating || 0,
      slug: course.slug || "",
      categoryId: course.categoryId || "uncategorized",
      unitCount: course.courseUnits.length,
      lessonCount: course.courseUnits.reduce(
        (acc, unit) => acc + unit._count.chapters, 
        0
      ),
      quizCount: course.courseUnits.reduce(
        (acc, unit) => acc + unit.chapters.reduce(
          (chapterAcc, chapter) => chapterAcc + chapter._count.courseQuizzes, 
          0
        ), 
        0
      ),
      userId: course.userId,
    }))
  } catch (error) {
    console.error('Error fetching courses:', error)
    return []
  }
})