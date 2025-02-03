"use server"

import prisma from "@/lib/db"
import { FullCourseType } from "../types/types"


export async function getCourseData(slug: string): Promise<FullCourseType | null> {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      ratings: true,
      courseUnits: {
        include: {
          chapters: {
            include: {
              courseQuizzes: {
                include: {
                  attempts: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      courseProgress: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  if (!course) return null

  const fullCourse: FullCourseType = {
    ...course,
    courseUnits: course.courseUnits.map((unit) => ({
      ...unit,
    chapters: unit.chapters.map((chapter) => ({
      ...chapter,
    
    })),
    })),
  }

  return fullCourse
}

