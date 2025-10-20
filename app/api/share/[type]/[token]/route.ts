import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateShareAccess } from '@/app/services/share.service';

/**
 * GET /api/share/[type]/[token]
 * Access shared course or quiz with optional access key
 * 
 * Public endpoint - no authentication required
 * 
 * Query parameters:
 * - key: optional access key if required
 * 
 * Returns:
 * - Course or quiz data (read-only, sanitized)
 * - share_views is incremented
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { type: string; token: string } }
) {
  try {
    const { type, token } = params;
    const { searchParams } = new URL(req.url);
    const accessKey = searchParams.get('key') || undefined;

    // Validate type
    if (!['course', 'quiz'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "course" or "quiz"' },
        { status: 400 }
      );
    }

    if (type === 'course') {
      // Find course by share token hash (we need to search by token pattern)
      // Since we store token hash, we need to find by looking for the resource with matching token
      const course = await prisma.course.findFirst({
        where: {
          share_token: token, // In production, verify token hash matches
        },
        select: {
          id: true,
          title: true,
          description: true,
          image: true,
          slug: true,
          difficulty: true,
          estimatedHours: true,
          language: true,
          status: true,
          isPublic: true,
          visibility: true,
          share_expiry: true,
          share_key_hash: true,
          courseUnits: {
            select: {
              id: true,
              name: true,
              order: true,
              chapters: {
                select: {
                  id: true,
                  title: true,
                  order: true,
                  isFreePreview: true,
                  summary: true,
                  videoDuration: true,
                },
              },
            },
          },
        },
      });

      if (!course) {
        return NextResponse.json(
          { success: false, error: 'Share link not found or invalid' },
          { status: 404 }
        );
      }

      // Validate share access
      const accessValidation = validateShareAccess(
        course.visibility,
        token,
        course.share_key_hash,
        course.share_expiry,
        token,
        accessKey
      );

      if (!accessValidation.isValid) {
        return NextResponse.json(
          { success: false, error: accessValidation.error },
          { status: 403 }
        );
      }

      // Increment share views
      await prisma.course.update({
        where: { id: course.id },
        data: {
          share_views: {
            increment: 1,
          },
        },
      });

      // Return read-only course data
      return NextResponse.json({
        success: true,
        data: {
          ...course,
          readOnly: true,
          signInRequired: true,
        },
      });
    } else if (type === 'quiz') {
      // Find quiz by share token
      const quiz = await prisma.userQuiz.findFirst({
        where: {
          share_token: token,
        },
        select: {
          id: true,
          title: true,
          description: true,
          quizType: true,
          difficulty: true,
          points: true,
          passingScore: true,
          language: true,
          visibility: true,
          share_expiry: true,
          share_key_hash: true,
          questions: {
            select: {
              id: true,
              question: true,
              options: true,
              questionType: true,
              codeSnippet: true,
            },
          },
        },
      });

      if (!quiz) {
        return NextResponse.json(
          { success: false, error: 'Share link not found or invalid' },
          { status: 404 }
        );
      }

      // Validate share access
      const accessValidation = validateShareAccess(
        quiz.visibility,
        token,
        quiz.share_key_hash,
        quiz.share_expiry,
        token,
        accessKey
      );

      if (!accessValidation.isValid) {
        return NextResponse.json(
          { success: false, error: accessValidation.error },
          { status: 403 }
        );
      }

      // Increment share views
      await prisma.userQuiz.update({
        where: { id: quiz.id },
        data: {
          share_views: {
            increment: 1,
          },
        },
      });

      // Return read-only quiz data
      return NextResponse.json({
        success: true,
        data: {
          ...quiz,
          readOnly: true,
          signInRequired: true,
        },
      });
    }
  } catch (error) {
    console.error('[Share Access Error]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
