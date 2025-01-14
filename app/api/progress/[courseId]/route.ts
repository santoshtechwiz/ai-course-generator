import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/authOptions';
import { prisma } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId } = await params;
  if (!courseId) {
    return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
  }

  const userId = session.user.id;

  const progress = await prisma.courseProgress.findUnique({
    where: {
      unique_user_course_progress: {
        userId: userId,
        courseId: parseInt(courseId),
      },
    },
  });

  // Parse completedChapters from JSON string to array
  if (progress && typeof progress.completedChapters === 'string') {
    progress.completedChapters = JSON.parse(progress.completedChapters);
  }

  return NextResponse.json({ progress });
}

export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId } = await params;
  if (!courseId) {
    return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
  }

  const userId = session.user.id;
  const data = await req.json();

  // Ensure completedChapters is an array of strings
  if (!Array.isArray(data.completedChapters)) {
    data.completedChapters = [];
  }

  if (!data.currentChapterId) {
    return NextResponse.json({ error: 'Current Chapter ID is required' }, { status: 400 });
  }

  const existingProgress = await prisma.courseProgress.findUnique({
    where: {
      unique_user_course_progress: {
        userId: userId,
        courseId: parseInt(courseId),
      },
    },
  });

  let existingCompletedChapters: string[] = [];
  if (existingProgress && typeof existingProgress.completedChapters === 'string') {
    try {
      existingCompletedChapters = JSON.parse(existingProgress.completedChapters);
    } catch (error) {
      console.error('Error parsing existing completedChapters:', error);
    }
  }

  const updatedCompletedChapters = [...new Set([...existingCompletedChapters, ...data.completedChapters])];

  const updatedProgress = await prisma.courseProgress.upsert({
    where: {
      unique_user_course_progress: {
        userId: userId,
        courseId: parseInt(courseId),
      },
    },
    update: {
      currentChapterId: +data.currentChapterId,
      completedChapters: JSON.stringify(updatedCompletedChapters),
      progress: data.progress,
      lastAccessedAt: new Date(),
      isCompleted: data.isCompleted || false,
    },
    create: {
      userId: userId,
      courseId: parseInt(courseId),
      currentChapterId: +data.currentChapterId,
      completedChapters: JSON.stringify(updatedCompletedChapters),
      progress: data.progress || 0,
      isCompleted: data.isCompleted || false,
    },
  });

  // Parse completedChapters from JSON string to array before sending the response
  if (updatedProgress && typeof updatedProgress.completedChapters === 'string') {
    updatedProgress.completedChapters = JSON.parse(updatedProgress.completedChapters);
  }

  return NextResponse.json({ progress: updatedProgress });
}
