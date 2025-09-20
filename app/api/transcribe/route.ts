import { NextRequest } from 'next/server';
import { voskService } from '@/app/services/vosk.service';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    if (!req.body) {
      return new Response('No file provided', { status: 400 });
    }

    // Create a temporary file path
    const tempDir = join(tmpdir(), 'vosk-uploads');
    await fs.mkdir(tempDir, { recursive: true });
    const fileHash = createHash('md5').update(Date.now().toString()).digest('hex');
    const tempPath = join(tempDir, `${fileHash}.mp3`);

    // Read request body and save to temp file
    const chunks: Uint8Array[] = [];
    const reader = req.body.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);
    await fs.writeFile(tempPath, buffer);

  // Perform transcription using the centralized Vosk service
  // We already save the uploaded file as a tempPath (mp3). Use the Vosk service to transcribe.
  const result = await voskService.transcribeVideo(`file://${tempPath}`);

    if (result.status === 'failed') {
      return new Response(JSON.stringify({ error: result.error || 'Transcription failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, transcript: result.transcript }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[API] Transcription error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}