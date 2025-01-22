import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 });
  }

  try {
    const { quizId, score, duration, answers } = await req.json();

    // Validate quizId
    const quizExists = await prisma.userQuiz.findUnique({
      where: { id: quizId },
    });

    if (!quizExists) {
      throw new Error('Invalid quizId: UserQuiz does not exist');
    }

    // Ensure duration is an integer
    const durationInSeconds = Math.round(duration);

    // Use a transaction for multiple database operations
    const result = await prisma.$transaction(async (prisma) => {
      // Step 1: Update userQuiz record
      const updatedUserQuiz = await prisma.userQuiz.update({
        where: { id: quizId },
        data: {
          timeEnded: new Date(),
          lastAttempted: new Date(),
          bestScore: {
            set: Math.max(score, quizExists.bestScore ?? 0),
          },
        },
      });

      // Step 2: Update user stats
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalQuizzesAttempted: { increment: 1 },
          totalTimeSpent: { increment: durationInSeconds },
        },
      });

      // Step 3: Create or update quizAttempt
      const existingAttempt = await prisma.userQuizAttempt.findUnique({
        where: {userId_userQuizId_createdAt: { userId, quizId,createdAt} },
      });

      let quizAttempt;
      if (existingAttempt) {
        quizAttempt = await prisma.userQuizAttempt.update({
          where: { id: existingAttempt.id },
          data: {
            score,
            timeSpent: durationInSeconds,
            improvement: score - (quizExists.bestScore ?? 0),
            accuracy: answers
              ? (answers.filter((a: any) => a.isCorrect).length / answers.length) * 100
              : null,
          },
        });
      } else {
        quizAttempt = await prisma.userQuizAttempt.create({
          data: {
            userId,
            userQuizId: quizId,
            score,
            timeSpent: durationInSeconds,
            accuracy: answers
              ? (answers.filter((a: any) => a.isCorrect).length / answers.length) * 100
              : null,
          },
        });
      }

      // Step 4: Validate and save answers
      if (answers && Array.isArray(answers)) {
        const validAnswers = answers.map((answer: any) => ({
          attemptId: quizAttempt.id,
          questionId: answer.questionId,
          userAnswer: answer.userAnswer,
          isCorrect: answer.isCorrect,
          timeSpent: Math.round(answer.timeSpent),
        }));

        if (validAnswers.length > 0) {
          await prisma.userQuizAttemptQuestion.createMany({
            data: validAnswers,
          });
        }
      }

      return { updatedUserQuiz, quizAttempt };
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error updating quiz score:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update quiz score' },
      { status: 500 }
    );
  }
}

