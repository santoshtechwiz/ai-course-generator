import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const userId = (await getServerSession(authOptions))?.user.id;
  try {
    const { quizId, score, duration, answers } = await req.json();  // Assuming `answers` contains user answers for each question

    // Ensure duration is an integer
    const durationInSeconds = Math.round(duration);

    // Step 1: Update userQuiz record
    const updatedUserQuiz = await prisma.userQuiz.update({
      where: { id: quizId },  // Ensure 'quizId' maps to a UserQuiz record
      data: {
        score,
        duration: durationInSeconds, // Store duration as integer
        timeEnded: new Date(),
      },
    });

    // Step 2: Update the user's total quizzes attempted and total time spent
    await prisma.user.update({
      where: { id: updatedUserQuiz.userId },
      data: {
        totalQuizzesAttempted: { increment: 1 },
        totalTimeSpent: { increment: durationInSeconds }, // Use the same integer value
      },
    });

    // Step 3: Update or create a record for the quiz attempt
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: { userId, quizId },
    });

    let quizAttemptId;

    if (existingAttempt) {
      // Update existing quiz attempt
      quizAttemptId = existingAttempt.id;
      await prisma.quizAttempt.update({
        where: { id: existingAttempt.id },
        data: { score, timeSpent: durationInSeconds },
      });
    } else {
      if (!userId) {
        throw new Error('User ID is undefined');
      }
      // Create a new quiz attempt record
      const newQuizAttempt = await prisma.quizAttempt.create({
        data: { userId, quizId, score, timeSpent: durationInSeconds },
      });
      quizAttemptId = newQuizAttempt.id;
    }

    // Step 4: Record the user answers at the question level
    if (answers && Array.isArray(answers)) {
      const attemptQuestionsData = answers.map((answer: any) => ({
        attemptId: quizAttemptId,
        questionId: answer.questionId, // assuming `answer` has `questionId` and `isCorrect`
        userAnswer: answer.userAnswer,  // The user's answer
        isCorrect: answer.isCorrect,  // Whether the answer was correct or not
        timeSpent: answer.timeSpent,  // Time spent on the question
      }));

      // Create records for each question in the quiz attempt
      await prisma.quizAttemptQuestion.createMany({
        data: attemptQuestionsData,
      });
    }

    return NextResponse.json({ success: true, updatedUserQuiz });
  } catch (error) {
    console.error('Error updating quiz score:', error);
    return NextResponse.json({ success: false, error: 'Failed to update quiz score' }, { status: 500 });
  }
}
