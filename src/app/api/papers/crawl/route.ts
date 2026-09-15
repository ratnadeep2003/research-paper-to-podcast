import { NextRequest, NextResponse } from "next/server";
import { crawlLevel3Citations } from "@/lib/citations/crawler";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, query, title, doi, abstract, fullText } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
    }

    const paperTitle = title || query || "Attention Is All You Need";

    // Update session title with paper title
    await prisma.session.update({
      where: { id: sessionId },
      data: { title: paperTitle.slice(0, 100) },
    });

    // Run recursive Level-3 citation crawl
    const papers = await crawlLevel3Citations({
      sessionId,
      rootTitle: paperTitle,
      rootDoi: doi,
      rootAbstract: abstract,
      rootFullText: fullText,
    });

    return NextResponse.json({ success: true, count: papers.length, data: papers });
  } catch (error) {
    console.error("Crawl error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to crawl citations" },
      { status: 500 }
    );
  }
}
