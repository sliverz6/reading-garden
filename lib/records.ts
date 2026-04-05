import { kv } from "@vercel/kv";
import type { RecordEntry, ReadingRecord, RecordsData } from "./types";

export type { RecordEntry, ReadingRecord, RecordsData };
export { getGrassLevel } from "./types";

const key = (date: string) => `record:${date}`;

export async function getAllRecords(): Promise<RecordsData> {
  const keys = await kv.keys("record:*");
  if (keys.length === 0) return {};
  const values = await Promise.all(keys.map((k) => kv.get<ReadingRecord>(k)));
  const result: RecordsData = {};
  keys.forEach((k, i) => {
    const record = values[i];
    if (record) result[k.replace("record:", "")] = record;
  });
  return result;
}

export async function getRecord(date: string): Promise<ReadingRecord | null> {
  return kv.get<ReadingRecord>(key(date));
}

export async function saveRecord(date: string, content: string, bookId?: string): Promise<ReadingRecord> {
  const existing = await getRecord(date);
  const newEntry: RecordEntry = { content, createdAt: new Date().toISOString(), ...(bookId ? { bookId } : {}) };
  const record: ReadingRecord = {
    date,
    entries: existing ? [...existing.entries, newEntry] : [newEntry],
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(date), record);
  return record;
}

export async function updateEntries(date: string, entries: RecordEntry[]): Promise<ReadingRecord> {
  if (entries.length === 0) {
    await kv.del(key(date));
    return { date, entries: [], updatedAt: new Date().toISOString() };
  }
  const record: ReadingRecord = { date, entries, updatedAt: new Date().toISOString() };
  await kv.set(key(date), record);
  return record;
}

export async function deleteRecord(date: string): Promise<void> {
  await kv.del(key(date));
}
