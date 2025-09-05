import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { progressService, ProgressUpdate } from "@/app/services/progress.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { updates }: { updates: ProgressUpdate[] } = await req.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    // 🚨 CRITICAL SECURITY FIX: Prevent DOS attacks
    const MAX_UPDATES = 50; // Reasonable limit to prevent abuse
    if (updates.length > MAX_UPDATES) {
      return NextResponse.json(
        { error: `Too many updates. Maximum ${MAX_UPDATES} allowed per request` },
        { status: 400 }
      );
    }

    // Security: Ensure user can only update their own progress
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      if (update.userId !== session.user.id) {
        return NextResponse.json(
          { error: `Unauthorized: Cannot update progress for different user in update ${i}` },
          { status: 403 }
        );
      }
    }

    // Use the unified progress service for bulk updates
    const result = await progressService.bulkUpdateProgress(updates);

    return NextResponse.json({
      message: `Bulk progress update completed. Success: ${result.success}, Failed: ${result.failed}`,
      success: result.success,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Bulk progress update error:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
