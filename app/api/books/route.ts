import { NextRequest, NextResponse } from "next/server";
import { getAllBooks, createBook } from "@/lib/books";

export async function GET() {
  try {
    const books = await getAllBooks();
    return NextResponse.json(books);
  } catch {
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, author } = await req.json() as { title: string; author: string };
    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    const book = await createBook(title.trim(), (author ?? "").trim());
    return NextResponse.json(book);
  } catch {
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}
