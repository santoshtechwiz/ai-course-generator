
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle active subscriptions
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (subscription) {
      // Optionally, cancel the subscription or mark it as inactive
      await prisma.userSubscription.delete({
        where: { userId },
      });
    }

    // Delete the user and cascade delete related records
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: "User, subscriptions, and related records deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
