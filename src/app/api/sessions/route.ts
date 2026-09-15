import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        papers: {
          select: { id: true, title: true, level: true },
        },
        podcast: {
          select: { id: true, status: true, duration: true, title: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("Failed to list sessions:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = body.title || "New Paper Session";

    const session = await prisma.session.create({
      data: {
        title,
      },
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 });
  }
}
