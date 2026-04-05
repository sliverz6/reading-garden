export interface RecordEntry {
  content: string;
  createdAt: string;
}

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
  if (!record || !record.entries?.length) return 0;
  const total = record.entries.reduce((s, e) => s + e.content.trim().length, 0);
  if (total === 0) return 0;
  if (total < 50) return 1;
  if (total < 150) return 2;
  if (total < 300) return 3;
  return 4;
}
