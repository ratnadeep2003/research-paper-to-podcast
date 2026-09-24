import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { answerPodcastInterruption } from "@/lib/llm/prompts";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, question, segmentId, pausedAtSec } = await req.json();

    if (!sessionId || !question) {
      return NextResponse.json({ success: false, error: "Missing sessionId or question" }, { status: 400 });
    }

    // 1. Record User's interruption message
    await prisma.message.create({
      data: {
        sessionId,
        role: "user",
        content: question,
        isInterrupt: true,
        pausedAtSec: pausedAtSec || null,
        pausedSegmentId: segmentId || null,
        resumed: false,
      },
    });

    // 2. Fetch segment context if provided
    let currentSegmentText = "The podcast hosts were discussing the core findings of the paper.";
    let currentSpeaker = "Host_Alex";

    if (segmentId) {
      const segment = await prisma.podcastSegment.findUnique({
        where: { id: segmentId },
      });
      if (segment) {
        currentSegmentText = segment.text;
        currentSpeaker = segment.speaker;
      }
    }

    // 3. Fetch papers for session context
    const papers = await prisma.paper.findMany({
      where: { sessionId },
      orderBy: [{ level: "asc" }],
    });

    // 4. Generate AI response with confirmation prompt
    const { answer, usedFallback } = await answerPodcastInterruption({
      question,
      currentSegmentText,
      currentSpeaker,
      papers: papers.map((p) => ({
        id: p.id,
        title: p.title,
        level: p.level,
        year: p.year,
        abstract: p.abstract,
        keyTakeaway: p.keyTakeaway,
      })),
    });

    // 5. Record Assistant response
    const assistantMessage = await prisma.message.create({
      data: {
        sessionId,
        role: "assistant",
        content: answer,
        isInterrupt: true,
        pausedAtSec: pausedAtSec || null,
        pausedSegmentId: segmentId || null,
        resumed: false,
      },
    });

    return NextResponse.json({
      success: true,
      answer,
      usedFallback, // true = Gemini failed and we used the static/degraded template
      assistantMessageId: assistantMessage.id,
    });
  } catch (error) {
    console.error("Interrupt handler error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to process interruption" },
      { status: 500 }
    );
  }
}