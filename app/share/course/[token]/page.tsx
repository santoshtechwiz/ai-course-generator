"use server"

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import prisma from "@/lib/db"

import { validateShareAccess } from "@/app/services/share.service"

import CourseViewer from "@/components/dashboard/CourseViewer"
import { CourseQuestion, FullChapter, FullCourseType, FullCourseUnit } from "@/app/types/course-types"

type ShareCoursePageParams = {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string }>
}

async function getCourseData(slug: string): Promise<FullCourseType | null> {
  try {
    const course = await prisma.course.findFirst({
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
      },
    })

    if (!course) return null

    // Transform to FullCourseType
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

    const fullCourse: FullCourseType = {
      id: course.id,
      title: course.title,
      description: course.description ?? undefined,
      image: course.image,
      userId: course.userId,
      isCompleted: course.isCompleted ?? false,
      isPublic: course.isPublic,
      slug: course.slug ?? "",
      isShared: true, // Mark as shared to disable progress tracking
      estimatedTime: course.estimatedHours ? `${course.estimatedHours} hours` : undefined,
      category: course.category ? {
        id: course.category.id,
        name: course.category.name
      } : undefined,
      rating: course.ratings.length > 0
        ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
        : undefined,
      students: course.ratings.length,
      viewCount: course.share_views || 0,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      courseUnits: course.courseUnits.map((unit, unitIndex): FullCourseUnit => ({
        id: unit.id,
        courseId: unit.courseId,
        title: unit.name,
        isCompleted: unit.isCompleted ?? false,
        duration: unit.duration,
        order: unit.order ?? unitIndex,
        chapters: unit.chapters.map((chapter, chapterIndex): FullChapter => {
          const estimatedDuration = 5 * 60
          // For shared courses, unlock ALL chapters; otherwise use default free logic (first 2)
          const isFree = true

          return {
            id: chapter.id,
            title: chapter.title,
            videoId: chapter.videoId,
            order: chapter.order ?? chapterIndex,
            isCompleted: chapter.isCompleted,
            summary: chapter.summary,
            description: chapter.title,
            unitId: chapter.unitId,
            summaryStatus: chapter.summaryStatus,
            videoStatus: chapter.videoStatus,
            isFree: isFree,
            duration: estimatedDuration,
            questions: chapter.courseQuizzes.map((quiz): CourseQuestion => ({
              id: quiz.id,
              question: quiz.question,
              answer: quiz.answer,
              options: typeof quiz.options === "string"
                ? quiz.options.split(",").map((opt) => opt.trim())
                : quiz.options || [],
            })),
          }
        }),
        name: ""
      })),
    }

    return fullCourse
  } catch (error) {
    console.error("Error fetching shared course data:", error)
    return null
  }
}

export default async function ShareCoursePage({ params, searchParams }: ShareCoursePageParams) {
  try {
    const { token } = await params
    const { k: accessKey } = await searchParams

    if (!token) return notFound()

    // Validate share access and get course
    const share = await prisma.course.findFirst({
      where: { share_token: token },
      select: {
        id: true,
        slug: true,
        visibility: true,
        share_expiry: true,
        share_key_hash: true,
      }
    })

    if (!share) return notFound()

    // Check access
    const validation = validateShareAccess(
      share.visibility || 'link-only',
      token,
      share.share_key_hash,
      share.share_expiry,
      token,
      accessKey
    )

    if (!validation.isValid) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-black mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-8">
              {validation.error || "This share link is invalid or has expired."}
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Return Home
            </a>
          </div>
        </div>
      )
    }

    // Fetch course data using slug
    const course = await getCourseData(share.slug!)

    if (!course) return notFound()

    // Increment share views
    await prisma.course.update({
      where: { id: share.id },
      data: { share_views: { increment: 1 } }
    }).catch(err => console.error("Error incrementing views:", err))

    // Render CourseViewer with MainContent (shows share course UI)
    return <CourseViewer course={course} />
  } catch (error) {
    console.error("Error in share course page:", error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">Failed to load the shared course.</p>
          <a href="/" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold">
            Go Home
          </a>
        </div>
      </div>
    )
  }
}
