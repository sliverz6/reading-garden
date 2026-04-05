import { NextRequest, NextResponse } from "next/server";
import { getRecord, saveRecord, deleteRecord, updateEntries } from "@/lib/records";
import type { RecordEntry } from "@/lib/records";

type Params = { params: Promise<{ date: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { date } = await params;
  const record = await getRecord(date);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(record);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { date } = await params;
  const { content, bookId } = await req.json() as { content: string; bookId?: string };
  if (typeof content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  const record = await saveRecord(date, content, bookId);
  return NextResponse.json(record);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { date } = await params;
  const { entries } = await req.json() as { entries: RecordEntry[] };
  const record = await updateEntries(date, entries);
  return NextResponse.json(record);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { date } = await params;
  await deleteRecord(date);
  return NextResponse.json({ ok: true });
}
