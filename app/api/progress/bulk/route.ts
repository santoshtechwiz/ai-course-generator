import { NextResponse } from 'next/server';
import { ProgressUpdate } from '@/lib/queues/ProgressQueue';
import prisma from '@/lib/db';


export async function POST(req: Request) {
  try {
    const { updates } = await req.json() as { updates: ProgressUpdate[] };

    // Group updates by type for efficient batch processing
    const videoUpdates = updates.filter(u => u.type === 'video');
    const quizUpdates = updates.filter(u => u.type === 'quiz');
    const chapterUpdates = updates.filter(u => u.type === 'chapter');

    await prisma.$transaction(async (tx) => {
      // Update video progress
      if (videoUpdates.length > 0) {
        await Promise.all(
          videoUpdates.map(update =>
            tx.courseProgress.upsert({
              where: {
                unique_user_course_progress: {
                  userId: update.userId,
                  courseId: update.courseId,
                }
              },
              create: {
                userId: update.userId,
                courseId: update.courseId,
                currentChapterId: update.chapterId,
                progress: update.progress,
                lastAccessedAt: new Date(update.timestamp),
                timeSpent: 0,
                interactionCount: 1,
              },
              update: {
                currentChapterId: update.chapterId,
                progress: {
                  set: Math.max(update.progress),
                },
                lastAccessedAt: new Date(update.timestamp),
                interactionCount: {
                  increment: 1,
                },
              },
            })
          )
        );
      }

      // Update quiz progress
      if (quizUpdates.length > 0) {
        await Promise.all(
          quizUpdates.map(update =>
            tx.courseQuizAttempt.create({
              data: {
                userId: update.userId,
                courseQuizId: update.metadata?.courseQuizId || update.metadata?.quizId,
                score: update.metadata?.score,
                accuracy: update.metadata?.accuracy,
                timeSpent: update.metadata?.timeSpent,
              },
            })
          )
        );
      }

      // Update chapter completion
      if (chapterUpdates.length > 0) {
        await Promise.all(
          chapterUpdates.map(update =>
            tx.courseProgress.update({
              where: {
                unique_user_course_progress: {
                  userId: update.userId,
                  courseId: update.courseId,
                }
              },
              data: {
                currentChapterId: update.chapterId,
                chapterProgress: {
                  ...update.metadata?.chapterProgress,
                },
                lastAccessedAt: new Date(update.timestamp),
              },
            })
          )
        );
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
