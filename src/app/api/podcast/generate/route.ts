import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePodcastDialogue } from "@/lib/llm/prompts";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
    }

    // Fetch all papers for session
    const papers = await prisma.paper.findMany({
      where: { sessionId },
      orderBy: [{ level: "asc" }, { relevanceScore: "desc" }],
    });

    if (papers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No papers found for this session. Ingest a paper first." },
        { status: 400 }
      );
    }

    // Set episode status to GENERATING
    let episode = await prisma.podcastEpisode.upsert({
      where: { sessionId },
      update: { status: "GENERATING" },
      create: {
        sessionId,
        title: `Deep Dive: ${papers[0]?.title || "Research Paper"}`,
        status: "GENERATING",
      },
    });

    // Generate dialogue turns via Gemini (or fallback synthesizer)
    const dialogueTurns = await generatePodcastDialogue(
      papers.map((p) => ({
        id: p.id,
        title: p.title,
        level: p.level,
        year: p.year,
        abstract: p.abstract,
        keyTakeaway: p.keyTakeaway,
      }))
    );

    // Delete existing segments if regenerating
    await prisma.podcastSegment.deleteMany({
      where: { episodeId: episode.id },
    });

    // Map paper titles back to IDs if mentioned
    const segmentsData = dialogueTurns.map((turn, index) => {
      let matchedPaperId: string | null = null;
      if (turn.paperTitle) {
        const found = papers.find(
          (p) =>
            p.title.toLowerCase().includes(turn.paperTitle!.toLowerCase()) ||
            turn.paperTitle!.toLowerCase().includes(p.title.toLowerCase())
        );
        if (found) matchedPaperId = found.id;
      }

      return {
        episodeId: episode.id,
        orderIndex: index,
        speaker: turn.speaker,
        speakerRole: turn.speakerRole,
        text: turn.text,
        paperId: matchedPaperId || (index === 0 ? papers[0]?.id : null),
        durationSec: Math.max(3, Math.round(turn.text.split(" ").length / 2.5)), // estimated duration in seconds
      };
    });

    await prisma.podcastSegment.createMany({
      data: segmentsData,
    });

    // Mark episode READY
    episode = await prisma.podcastEpisode.update({
      where: { id: episode.id },
      data: {
        status: "READY",
        summary: `A thorough 3-level synthesis analyzing "${papers[0]?.title}" through its seminal roots and direct predecessors.`,
      },
      include: {
        segments: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, episode });
  } catch (error) {
    console.error("Podcast generation error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to generate podcast" },
      { status: 500 }
    );
  }
}
