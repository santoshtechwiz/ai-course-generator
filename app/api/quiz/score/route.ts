import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server'

export async function POST(req: Request) {

  const userId = (await getServerSession(authOptions))?.user.id;
  try {
    const { quizId, score, duration } = await req.json()

    // Ensure duration is an integer
    const durationInSeconds = Math.round(duration)

    const updatedQuiz = await prisma.userQuiz.update({
      where: { id: quizId },
      data: {
        score: score,
        duration: durationInSeconds, // Store duration as integer
        timeEnded: new Date(),
      },
    })

    // Update user's total quizzes attempted and time spent
    await prisma.user.update({
      where: { id: updatedQuiz.userId },
      data: {
        totalQuizzesAttempted: { increment: 1 },
        totalTimeSpent: { increment: durationInSeconds }, // Use the same integer value
      },
    })
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: { userId, quizId },
    });

    if (existingAttempt) {
      // Update the existing record
     await prisma.quizAttempt.update({
        where: { id: existingAttempt.id },
        data: { score, timeSpent: durationInSeconds },
      });
    } else {
      if (!userId) {
        throw new Error('User ID is undefined');
      }
      // Create a new record
      await prisma.quizAttempt.create({
        data: { userId, quizId, score, timeSpent: durationInSeconds },
      });
    }


    return NextResponse.json({ success: true, updatedQuiz })
  } catch (error) {
    console.error('Error updating quiz score:', error)
    return NextResponse.json({ success: false, error: 'Failed to update quiz score' }, { status: 500 })
  }
}

