import { NextRequest, NextResponse } from 'next/server';
import { voskService } from '@/app/services/vosk.service';
import { z } from 'zod';

const transcriptRequestSchema = z.object({
  videoUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl } = transcriptRequestSchema.parse(body);

    const result = await voskService.transcribeVideo(videoUrl);

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error || 'Failed to generate transcript' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 200,
      message: 'Transcript generated successfully',
      transcript: result.transcript,
    });

  } catch (error) {
    console.error('[Vosk API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}