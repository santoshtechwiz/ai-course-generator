import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/share/revoke
 * Revoke a shareable link for a course or quiz
 * 
 * Requires authentication - only owner can revoke share links
 * 
 * Body:
 * {
 *   type: 'course' | 'quiz',
 *   id: number (course ID or quiz ID)
 * }
 * 
 * Returns:
 * {
 *   success: boolean,
 *   message?: string,
 *   visibility: string (set to 'private')
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
    const { type, id } = body;

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

    // Revoke share based on type
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
          { success: false, error: 'Forbidden - only owner can revoke share links' },
          { status: 403 }
        );
      }

      // Update course - clear share data and set to private
      await prisma.course.update({
        where: { id: parseInt(id) },
        data: {
          visibility: 'private',
          share_token: null,
          share_key_hash: null,
          share_expiry: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Share link revoked successfully',
        visibility: 'private',
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
          { success: false, error: 'Forbidden - only owner can revoke share links' },
          { status: 403 }
        );
      }

      // Update quiz - clear share data and set to private
      await prisma.userQuiz.update({
        where: { id: parseInt(id) },
        data: {
          visibility: 'private',
          share_token: null,
          share_key_hash: null,
          share_expiry: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Share link revoked successfully',
        visibility: 'private',
      });
    }
  } catch (error) {
    console.error('[Share Revoke Error]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
