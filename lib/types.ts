export interface RecordEntry {
  content: string;
  createdAt: string;
  bookId?: string;
}

export type BookStatus = "reading" | "finished" | "paused";

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  createdAt: string;
  finishedAt?: string;
}

export type BooksData = Record<string, Book>;

export interface ReadingRecord {
  date: string;
  entries: RecordEntry[];
  updatedAt: string;
}

export type RecordsData = Record<string, ReadingRecord>;

/** 현지 날짜 기준 YYYY-MM-DD 문자열 반환 */
export function toLocalDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 해당 날 전체 기록 길이 기반 색상 레벨 (0~4) */
export function getGrassLevel(record: ReadingRecord | undefined): number {
  const count = record?.entries?.length ?? 0;
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  if (count <= 8) return 4;
  return 5;
}
