import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, props: { params: Promise<{ chapterId: string }> }) {
  const params = await props.params;
  const chapterId = parseInt(params.chapterId);

  if (isNaN(chapterId)) {
    return NextResponse.json({ success: false, error: "Invalid chapter ID" }, { status: 400 });
  }

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { videoId: true, summary: true, summaryStatus: true },
    });

    if (!chapter) {
      return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json({
      isReady: chapter.videoId !== null && chapter.summaryStatus === 'COMPLETED',
      failed: chapter.summaryStatus === 'FAILED',
      summaryStatus: chapter.summaryStatus,
    });
  } catch (error) {
    console.error("Error checking chapter status:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

