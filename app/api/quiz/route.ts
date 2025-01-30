import { generateQuestions } from '@/lib/chatgpt/gpt';
import { getQuestionsSchema } from '@/schema/schema';

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export async function POST(req: Request) {
  try {
    const { amount, topic, type,difficulty,userType} = getQuestionsSchema.parse(await req.json());
    const  questions = await generateQuestions({ amount, topic, type,difficulty,userType });

    return NextResponse.json(questions);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
