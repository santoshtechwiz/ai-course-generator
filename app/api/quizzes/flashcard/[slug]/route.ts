import prisma from "@/lib/db";
import { NextResponse } from "next/server";


export async function GET(_: Request, props: { params: Promise<{ slug: string }> }): Promise<NextResponse> {
    const { slug } = await props.params
    if (!slug) {
        return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }
    try {

        const flashcardQuiz = await prisma.userQuiz.findFirst({
            where: {
                slug: slug,
            },
            select: {
                id: true,
                userId: true,
                isFavorite: true,
                isPublic: true,
                title: true,
                slug: true,
                flashCards: true
            },
        });
        if (!flashcardQuiz) {
            return NextResponse.json(
                { error: "Flashcard quiz not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(flashcardQuiz || {}, { status: 200 });
    } catch (error) {
        console.error("Error fetching flashcard quiz:", error);
        return NextResponse.json(
            { error: "Failed to fetch flashcard quiz" },
            { status: 500 }
        );
    }
}
