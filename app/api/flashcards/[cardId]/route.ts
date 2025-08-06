import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { flashcardService } from "@/app/services/flashcard.service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ quizType: string; cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { saved } = body;

    if (typeof saved !== 'boolean') {
      return NextResponse.json({ error: "Invalid saved value" }, { status: 400 });
    }

    const result = await flashcardService.saveCard(
      parseInt(cardId),
      session.user.id,
      saved
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error saving flashcard:", error);
    return NextResponse.json(
      { error: "Failed to save flashcard" },
      { status: 500 }
    );
  }
}
