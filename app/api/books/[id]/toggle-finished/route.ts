import { NextRequest, NextResponse } from "next/server";
import { toggleFinished } from "@/lib/books";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const book = await toggleFinished(id);
    return NextResponse.json(book);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: msg === "Book not found" ? 404 : 500 });
  }
}
