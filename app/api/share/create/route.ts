import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateShareData, hashValue } from '@/app/services/share.service';

/**
 * POST /api/share/create
 * Create a shareable link for a course or quiz
 * 
 * Requires authentication - only owner can create share links
 * 
 * Body:
 * {
 *   type: 'course' | 'quiz',
 *   id: number (course ID or quiz ID),
 *   withAccessKey?: boolean (default: false),
 *   expiryDays?: number | null (default: null = never expires),
 *   visibility?: 'link-only' | 'public' (default: 'link-only')
 * }
 * 
 * Returns:
 * {
 *   success: boolean,
 *   shareUrl?: string,
 *   accessKey?: string,
 *   expiry?: DateTime,
 *   visibility: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();
    const { type, id, withAccessKey = false, expiryDays = null, visibility = 'link-only' } = body;

    // Validate input
    if (!type || !id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type and id' },
        { status: 400 }
      );
    }

    if (!['course', 'quiz'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "course" or "quiz"' },
        { status: 400 }
      );
    }

    if (!['link-only', 'public'].includes(visibility)) {
      return NextResponse.json(
        { success: false, error: 'Invalid visibility. Must be "link-only" or "public"' },
        { status: 400 }
      );
    }

    // Verify ownership based on type
    if (type === 'course') {
      const course = await prisma.course.findUnique({
        where: { id: parseInt(id) },
      });

      if (!course) {
        return NextResponse.json(
          { success: false, error: 'Course not found' },
          { status: 404 }
        );
      }

      if (course.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - only owner can create share links' },
          { status: 403 }
        );
      }

      // Generate share data
      const shareData = generateShareData(withAccessKey, expiryDays);

      // Update course with share information (store plain token and hashed key)
      const updatedCourse = await prisma.course.update({
        where: { id: parseInt(id) },
        data: {
          visibility,
          share_token: shareData.token, // Store plain token so we can compare directly
          share_key_hash: shareData.keyHash,
          share_expiry: shareData.expiry,
        },
      });

      // Construct share URL (base URL will be added by frontend)
      const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/share/course/${shareData.token}`;

      return NextResponse.json({
        success: true,
        shareUrl,
        accessKey: shareData.key,
        expiry: shareData.expiry,
        visibility,
        message: 'Share link created successfully',
      });
    } else if (type === 'quiz') {
      const quiz = await prisma.userQuiz.findUnique({
        where: { id: parseInt(id) },
      });

      if (!quiz) {
        return NextResponse.json(
          { success: false, error: 'Quiz not found' },
          { status: 404 }
        );
      }

      if (quiz.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - only owner can create share links' },
          { status: 403 }
        );
      }

      // Generate share data
      const shareData = generateShareData(withAccessKey, expiryDays);

      // Update quiz with share information (store plain token and hashed key)
      const updatedQuiz = await prisma.userQuiz.update({
        where: { id: parseInt(id) },
        data: {
          visibility,
          share_token: shareData.token, // Store plain token so we can compare directly
          share_key_hash: shareData.keyHash,
          share_expiry: shareData.expiry,
        },
      });

      // Construct share URL
      const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/share/quiz/${shareData.token}`;

      return NextResponse.json({
        success: true,
        shareUrl,
        accessKey: shareData.key,
        expiry: shareData.expiry,
        visibility,
        message: 'Share link created successfully',
      });
    }
  } catch (error) {
    console.error('[Share Create Error]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
