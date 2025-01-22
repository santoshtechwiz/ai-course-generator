import { NextResponse } from "next/server";
import ytdl from "ytdl-core";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

export async function GET(req: Request, props: { params: Promise<{ videoId: string }> }) {
  const params = await props.params;
  const videoId = params.videoId;

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId parameter" }, { status: 400 });
  }

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);

    if (!info.player_response.captions) {
      return NextResponse.json({ error: "No captions available." }, { status: 404 });
    }

    const tracks = info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks;

    if (!tracks || !tracks.length) {
      return NextResponse.json({ error: "No caption tracks available." }, { status: 404 });
    }

    const parser = new XMLParser();
    const track = tracks[0];
    const response = await axios.get(track.baseUrl);
    const parsedContent = parser.parse(response.data);

    if (parsedContent && parsedContent.transcript && Array.isArray(parsedContent.transcript.text)) {
      // Limit the number of transcript items (e.g., first 10 items)
      const limitedTranscript = parsedContent.transcript.text.slice(0, 10);
      
      const transcriptText = limitedTranscript
        .map((item: any) => {
          if (typeof item === 'string') return item;
          return item.__text || item._text || '';
        })
        .filter((text: string) => text.trim() !== '') // Remove empty strings
        .join(' ')
        .replace(/\n/g, ' ');

      const transcriptResponse = {
        status: 200,
        message: "Transcript fetched successfully (limited to 10 items).",
        transcript: transcriptText,
      };

      return NextResponse.json(transcriptResponse);
    } else {
      return NextResponse.json({ 
        status: 204,
        message: "No valid transcript content found for the provided video ID.",
      }, { status: 204 });
    }
  } catch (error) {
    console.error("Error fetching subtitles:", error);
    return NextResponse.json({ 
      status: 500,
      message: `Error fetching transcript: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }, { status: 500 });
  }
}

