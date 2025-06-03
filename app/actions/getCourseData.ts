"use server"

import prisma from "@/lib/db"
import type { FullCourseType, FullCourseUnit, FullChapter, CourseProgress, CourseQuestion } from "../types/types"

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

  // Transform the data to match the FullCourseType interface
  const fullCourse: FullCourseType = {
    id: course.id,
    title: course.title, // Map name to title
    description: course.description,
    image: course.image,
    viewCount: course.viewCount,
    userId: course.userId,
    categoryId: course.categoryId,
    isCompleted: course.isCompleted,
    isPublic: course.isPublic,
    slug: course.slug,
    difficulty: course.difficulty,
    estimatedHours: course.estimatedHours,
    category: course.category,
    ratings: course.ratings,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,

    // Transform courseUnits
    courseUnits: course.courseUnits.map(
      (unit): FullCourseUnit => ({
        id: unit.id,
        courseId: unit.courseId,
        title: unit.name, // Map name to title
        isCompleted: unit.isCompleted,
        duration: unit.duration,
        order: unit.order,

        // Transform chapters
        chapters: unit.chapters.map(
          (chapter): FullChapter => ({
            id: chapter.id,
            title: chapter.title, // Map name to title
            videoId: chapter.videoId,
            order: chapter.order,
            isCompleted: chapter.isCompleted,
            summary: chapter.summary,
            description: chapter.title,
            unitId: chapter.unitId,
            summaryStatus: chapter.summaryStatus,
            videoStatus: chapter.videoStatus,

            // Transform courseQuizzes to questions
            questions: chapter.courseQuizzes.map(
              (quiz): CourseQuestion => ({
                id: quiz.id,
                question: quiz.question,
                answer: quiz.answer,
                // Handle options - convert from string to string[] if needed
                options:
                  typeof quiz.options === "string"
                    ? quiz.options.split(",").map((opt) => opt.trim())
                    : quiz.options || [],
              }),
            ),
          }),
        ),
      }),
    ),

    // Transform courseProgress
    courseProgress: course.courseProgress.map(
      (progress): CourseProgress => ({
        id: progress.id,
        userId: progress.userId,
        courseId: progress.courseId,
        currentChapterId: progress.currentChapterId,
        currentUnitId: progress.currentUnitId,
        completedChapters: progress.completedChapters,
        progress: progress.progress,
        lastAccessedAt: progress.lastAccessedAt,
        timeSpent: progress.timeSpent,
        isCompleted: progress.isCompleted,
        completionDate: progress.completionDate,
        quizProgress: progress.quizProgress,
        notes: progress.notes,
        bookmarks: progress.bookmarks,
        lastInteractionType: progress.lastInteractionType,
        interactionCount: progress.interactionCount,
        engagementScore: progress.engagementScore,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
      }),
    ),
  }

  return fullCourse
}