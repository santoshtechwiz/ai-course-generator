// Lightweight stub implementation to avoid bundling native modules (vosk / fluent-ffmpeg)
// during Next.js production build. This keeps the server code importable while
// providing a clear runtime failure when transcription is attempted in an
// environment that doesn't have the native tools installed.

interface VoskTranscriptionResult {
  status: 'completed' | 'failed';
  transcript?: string;
  error?: string;
}

class VoskServiceStub {
  public async transcribeVideo(_videoUrl: string): Promise<VoskTranscriptionResult> {
    const msg = 'Vosk transcription is not available in this build. Ensure vosk and ffmpeg are installed and enable the transcription feature in a Node.js environment.'
    console.warn('[Vosk Stub] transcribeVideo called but Vosk is disabled:', msg)
    return { status: 'failed', error: msg }
  }
}

export const voskService = new VoskServiceStub()