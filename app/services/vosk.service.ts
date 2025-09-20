import { join } from 'path';
import { tmpdir } from 'os';
import { promises as fs, createReadStream } from 'fs';
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';

// Dynamic imports for Vosk to avoid server-side issues
let vosk: any = null;
let Model: any = null;
let KaldiRecognizer: any = null;

export interface VoskTranscriptionResult {
  status: 'completed' | 'failed';
  transcript?: string;
  error?: string;
}

export class VoskService {
  private static instance: VoskService;
  private initialized = false;
  private readonly MODEL_PATH: string;
  private readonly TMP_DIR: string;
  private readonly SAMPLE_RATE = 16000;

  private constructor() {
    this.MODEL_PATH = process.env.VOSK_MODEL_PATH || join(process.cwd(), 'models/vosk-model-small-en-us-0.15');
    this.TMP_DIR = join(tmpdir(), 'vosk-transcriptions');
    // Create temp directory
    fs.mkdir(this.TMP_DIR, { recursive: true }).catch(console.error);
  }

  public static getInstance(): VoskService {
    if (!VoskService.instance) {
      VoskService.instance = new VoskService();
    }
    return VoskService.instance;
  }

  private async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Avoid bundlers trying to resolve 'vosk' during client-side builds.
      // Use a runtime require when available (Node environment).
      if (typeof window === 'undefined') {
        // Use an indirect module name to avoid static analysis by bundlers
        const moduleName = 'vosk';

        // Prefer runtime require if available, otherwise dynamic import
        let voskModule: any = null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          if (typeof require === 'function') {
            // Use eval to avoid bundlers replacing the require call
            // eslint-disable-next-line no-eval
            const r: any = eval('require');
            voskModule = r(moduleName);
          } else {
            voskModule = await import(moduleName);
          }
        } catch (innerErr) {
          // Fallback to dynamic import which may still fail at runtime if module isn't present
          voskModule = await import(moduleName).catch((e) => { throw e });
        }

        vosk = voskModule;
        Model = voskModule.Model;
        KaldiRecognizer = voskModule.KaldiRecognizer;
        this.initialized = true;
      } else {
        throw new Error('Vosk can only be initialized in a Node.js server environment');
      }
    } catch (error) {
      console.error('[Vosk] Initialization error:', error);
      throw error;
    }
  }

  private async downloadAudio(videoUrl: string): Promise<string> {
    const audioPath = join(this.TMP_DIR, `${Date.now()}.wav`);

    return new Promise((resolve, reject) => {
      const stream = ytdl(videoUrl, {
        quality: 'highestaudio',
        filter: 'audioonly',
      });

      ffmpeg(stream)
        .toFormat('wav')
        .outputOptions([
          '-acodec pcm_s16le',
          `-ar ${this.SAMPLE_RATE}`,
          '-ac 1'
        ])
        .output(audioPath)
        .on('error', (error: Error) => {
          console.error('[Vosk] FFmpeg error:', error);
          reject(error);
        })
        .on('end', () => resolve(audioPath))
        .run();
    });
  }

  private async transcribeAudio(audioPath: string): Promise<string> {
    if (!this.initialized || !Model || !KaldiRecognizer) {
      await this.init();
    }

    const model = new Model(this.MODEL_PATH);
    const recognizer = new KaldiRecognizer(model, this.SAMPLE_RATE);
    const audioStream = createReadStream(audioPath);
    let transcript = '';

    return new Promise((resolve, reject) => {
      audioStream.on('data', (chunk: string | Buffer) => {
        if (Buffer.isBuffer(chunk) && recognizer.AcceptWaveform(chunk)) {
          const result = JSON.parse(recognizer.Result());
          if (result.text) {
            transcript += result.text + ' ';
          }
        }
      });

      audioStream.on('end', () => {
        const finalResult = JSON.parse(recognizer.FinalResult());
        if (finalResult.text) {
          transcript += finalResult.text;
        }
        resolve(transcript.trim());
      });

      audioStream.on('error', (error: Error) => {
        console.error('[Vosk] Audio processing error:', error);
        reject(error);
      });
    });
  }

  public async transcribeVideo(videoUrl: string): Promise<VoskTranscriptionResult> {
    let audioPath: string | undefined;

    try {
      // Download and convert audio
      audioPath = await this.downloadAudio(videoUrl);

      // Transcribe audio
      const transcript = await this.transcribeAudio(audioPath);

      return {
        status: 'completed',
        transcript
      };

    } catch (error) {
      console.error('[Vosk] Transcription failed:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };

    } finally {
      // Clean up temp file
      if (audioPath) {
        await fs.unlink(audioPath).catch(console.error);
      }
    }
  }
}

export const voskService = VoskService.getInstance();