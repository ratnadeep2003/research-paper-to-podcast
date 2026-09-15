import { NextRequest, NextResponse } from "next/server";
import { parsePdfBuffer } from "@/lib/pdf/extractor";
import { crawlLevel3Citations } from "@/lib/citations/crawler";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string | null;

    if (!file || !sessionId) {
      return NextResponse.json({ success: false, error: "Missing file or sessionId" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract PDF text
    const extracted = await parsePdfBuffer(buffer);

    // Update session title
    const sessionTitle = extracted.title.length > 5 ? extracted.title : file.name.replace(/\.[^/.]+$/, "");
    await prisma.session.update({
      where: { id: sessionId },
      data: { title: sessionTitle.slice(0, 100) },
    });

    // Crawl Level-3 Citations
    const papers = await crawlLevel3Citations({
      sessionId,
      rootTitle: sessionTitle,
      rootAbstract: extracted.abstract,
      rootFullText: extracted.fullText.slice(0, 50000), // safe sample of full text
    });

    return NextResponse.json({
      success: true,
      extracted: {
        title: sessionTitle,
        abstract: extracted.abstract,
        pages: extracted.numPages,
      },
      papers,
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to process PDF" },
      { status: 500 }
    );
  }
}
