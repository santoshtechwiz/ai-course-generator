import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { flashcardService } from "@/app/services/flashcard.service";
import { z } from "zod";

const saveCardSchema = z.object({
  cardId: z.number(),
  isSaved: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { cardId, isSaved } = saveCardSchema.parse(body);

    const updatedCard = await flashcardService.saveCard(cardId, session.user.id, isSaved);

    return NextResponse.json({
      success: true,
      data: updatedCard,
      message: isSaved ? "Card saved successfully" : "Card unsaved successfully",
    });
  } catch (error) {
    console.error("Error saving flashcard:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
      }
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Failed to save flashcard" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const savedCards = await flashcardService.getSavedCards(session.user.id);

    return NextResponse.json({
      success: true,
      data: savedCards,
    });
  } catch (error) {
    console.error("Error fetching saved flashcards:", error);
    return NextResponse.json({ error: "Failed to fetch saved flashcards" }, { status: 500 });
  }
}
