import { NextRequest, NextResponse } from "next/server";
import { updateBook, deleteBook } from "@/lib/books";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const patch = await req.json();
    const book = await updateBook(id, patch);
    return NextResponse.json(book);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: msg === "Book not found" ? 404 : 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await deleteBook(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}
