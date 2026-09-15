import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, messageText } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
    }

    const confirmationText = messageText || "Yes, resume the podcast.";

    // 1. Record user's confirmation message
    await prisma.message.create({
      data: {
        sessionId,
        role: "user",
        content: confirmationText,
        resumed: true,
      },
    });

    // 2. Mark previous pending interrupt messages as resumed
    await prisma.message.updateMany({
      where: {
        sessionId,
        isInterrupt: true,
        resumed: false,
      },
      data: {
        resumed: true,
      },
    });

    // 3. System confirmation acknowledgment
    await prisma.message.create({
      data: {
        sessionId,
        role: "system",
        content: "Resuming episode playback from previous timestamp...",
        resumed: true,
      },
    });

    return NextResponse.json({ success: true, shouldResume: true });
  } catch (error) {
    console.error("Confirmation error:", error);
    return NextResponse.json({ success: false, error: "Failed to confirm" }, { status: 500 });
  }
}
