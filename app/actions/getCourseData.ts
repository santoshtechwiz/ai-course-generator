"use server"

import prisma from "@/lib/db"
import type { FullCourseType, FullCourseUnit, FullChapter, CourseProgress, CourseQuestion } from "../types/types"

export async function getCourseData(slug: string): Promise<FullCourseType | null> {
  try {
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        ratings: true,
        courseUnits: {
          orderBy: { order: 'asc' },
          include: {
            chapters: {
              orderBy: { order: 'asc' },
              include: {
                courseQuizzes: true,
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

    // Determine the first two chapters across the entire course to be free
    const freeChapterIds = new Set<number>()
    let globalChapterIndex = 0
    for (const unit of course.courseUnits) {
      for (const chapter of unit.chapters) {
        if (globalChapterIndex < 2) {
          freeChapterIds.add(chapter.id)
        }
        globalChapterIndex++
      }
    }

    // Transform the data to match the FullCourseType interface
    const fullCourse: FullCourseType = {
      id: course.id,
      title: course.title,
      description: course.description ?? undefined,
      image: course.image,
      userId: course.userId,
      isCompleted: course.isCompleted ?? false,
      isPublic: course.isPublic,
      slug: course.slug ?? "",
        estimatedTime: course.estimatedHours ? `${course.estimatedHours} hours` : undefined,
      category: course.category ? { 
        id: course.category.id, 
        name: course.category.name 
      } : undefined,
      rating: course.ratings.length > 0 
        ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length 
        : undefined,
      students: course.ratings.length, // Use ratings count as student count for now
       viewCount: 0, // This field doesn't exist in schema, setting to 0
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),

      // Transform courseUnits
      courseUnits: course.courseUnits.map(
        (unit, unitIndex): FullCourseUnit => ({
          id: unit.id,
          courseId: unit.courseId,
          title: unit.name,
          isCompleted: unit.isCompleted ?? false,
          duration: unit.duration,
          order: unit.order ?? unitIndex,

          // Transform chapters
          chapters: unit.chapters.map(
            (chapter, chapterIndex): FullChapter => {
              // Calculate a reasonable duration - approx 5 minutes per chapter
              const estimatedDuration = 5 * 60; // 5 minutes in seconds
              
              // Determine if chapter is free: first two chapters overall
              const isFree = freeChapterIds.has(chapter.id);
              
              return {
                id: chapter.id,
                title: chapter.title,
                videoId: chapter.videoId,
                order: chapter.order ?? chapterIndex,
                isCompleted: chapter.isCompleted,
                summary: chapter.summary,
                description: chapter.title, // Use title as description if none available
                unitId: chapter.unitId,
                summaryStatus: chapter.summaryStatus,
                videoStatus: chapter.videoStatus,
                isFree: isFree,
                duration: estimatedDuration,

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
              };
            }
          ),
        }),
      ),
    }

    return fullCourse
  } catch (error) {
    console.error("Error fetching course data:", error)
    return null
  }
}