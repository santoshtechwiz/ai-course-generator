import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId, resetType } = await req.json();

    if (!userId || !resetType) {
      return NextResponse.json(
        { message: "Missing required fields: userId or resetType" },
        { status: 400 }
      );
    }

    // Validate resetType
    if (!["free", "inactive"].includes(resetType)) {
      return NextResponse.json(
        { message: "Invalid resetType. Must be 'free' or 'inactive'." },
        { status: 400 }
      );
    }

    // Fetch the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Update subscription based on resetType
    if (resetType === "free") {
      await prisma.userSubscription.updateMany({
        where: { userId },
        data: {
          status: "CANCELLED",
          
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          userType: "FREE",
          credits: 0,
        },
      });
    } else if (resetType === "inactive") {
      await prisma.userSubscription.updateMany({
        where: { userId },
        data: {
          status: "INACTIVE",
        },
      });
    }

    return NextResponse.json(
      { message: "Subscription reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting subscription:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
