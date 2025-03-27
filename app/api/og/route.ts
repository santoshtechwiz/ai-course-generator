import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Default Title';


  return NextResponse.json({
    title,
    description: 'Default Description',
    image: {
      url: 'https://courseai.io/default-thumbnail.png',
      alt: 'Image Alt Text',
    },
  });


}
