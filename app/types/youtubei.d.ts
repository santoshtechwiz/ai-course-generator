declare module 'youtubei.js' {
  interface InnertubeConfig {
    cookie?: string;
  }

  interface CaptionTrack {
    language_code?: string;
    languageCode?: string;
    fetch(): Promise<{
      events?: Array<{
        segs?: Array<{ utf8?: string }>;
        tStartMs?: number;
        dDurationMs?: number;
      }>;
    }>;
  }

  interface VideoInfo {
    captions?: {
      captionTracks?: CaptionTrack[];
    };
  }

  export class Innertube {
    static create(config?: InnertubeConfig): Promise<Innertube>;
    getInfo(videoId: string): Promise<VideoInfo>;
  }
}