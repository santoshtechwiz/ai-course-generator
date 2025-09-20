declare module 'youtubei.js' {
  export interface InnertubeConfig {
    lang?: string;
    location?: string;
    cookie?: string;
    retriesOnFailure?: number;
  }

  export class Innertube {
    constructor(config?: InnertubeConfig);
    static create(config?: InnertubeConfig): Promise<Innertube>;
    getBasicInfo(videoId: string): Promise<any>;
    getTranscript(videoId: string): Promise<any>;
  }
}