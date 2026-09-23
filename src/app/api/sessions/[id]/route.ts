import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing session id" }, { status: 400 });
    }

    let session = await prisma.session.findUnique({
      where: { id },
      include: {
        papers: {
          orderBy: [{ level: "asc" }, { relevanceScore: "desc" }],
        },
        podcast: {
          include: {
            segments: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // If session doesn't exist (e.g. fresh DB or stale URL), auto-create so the user never gets an error
    if (!session) {
      session = await prisma.session.create({
        data: {
          id,
          title: "New Research Session",
        },
        include: {
          papers: true,
          podcast: {
            include: {
              segments: true,
            },
          },
          messages: true,
        },
      });
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing session id" }, { status: 400 });
    }

    await prisma.session.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete session:", error);
    return NextResponse.json({ success: false, error: "Failed to delete session" }, { status: 500 });
  }
}
