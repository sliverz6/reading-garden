import { NextResponse } from "next/server";
import { getAllRecords } from "@/lib/records";

export async function GET() {
  try {
    const records = await getAllRecords();
    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: "Failed to read records" }, { status: 500 });
  }
}
