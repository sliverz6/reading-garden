"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";
import ContributionGraph from "@/components/ContributionGraph";
import RecordWriteModal from "@/components/RecordWriteModal";
import type { RecordsData, ReadingRecord, RecordEntry } from "@/lib/types";
import { toLocalDateStr } from "@/lib/types";

function formatDisplayDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

type ModalMode =
  | { type: "add" }
  | { type: "edit"; idx: number; initialContent: string };

function HomeContent() {
  const [records, setRecords] = useState<RecordsData>({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState<ModalMode | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date");

  const fetchRecords = useCallback(async () => {
    const res  = await fetch("/api/records");
    const data: RecordsData = await res.json();
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // 날짜가 바뀌면 모달 닫기
  useEffect(() => { setModal(null); }, [selectedDate]);

  const handleDateClick = (date: string) => {
    if (selectedDate === date) {
      router.replace("/", { scroll: false });
    } else {
      router.replace(`/?date=${date}`, { scroll: false });
    }
  };

  const applyEntries = async (date: string, entries: RecordEntry[]) => {
    const res = await fetch(`/api/records/${date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    const updated: ReadingRecord = await res.json();
    setRecords((prev) => {
      if (entries.length === 0) {
        const next = { ...prev };
        delete next[date];
        return next;
      }
      return { ...prev, [date]: updated };
    });
  };

  const handleDelete = async (date: string, idx: number) => {
    const record = records[date];
    if (!record) return;
    await applyEntries(date, record.entries.filter((_, i) => i !== idx));
  };

  /** 모달 onSave 핸들러 — 추가/수정 분기 */
  const handleModalSave = async (content: string) => {
    if (!selectedDate) return;
    if (modal?.type === "edit") {
      const record = records[selectedDate];
      if (!record) return;
      const { idx } = modal;
      const newEntries = record.entries.map((e, i) =>
        i === idx ? { ...e, content } : e
      );
      await applyEntries(selectedDate, newEntries);
    } else {
      const res = await fetch(`/api/records/${selectedDate}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const record: ReadingRecord = await res.json();
      setRecords((prev) => ({ ...prev, [record.date]: record }));
    }
  };

  const totalDays = Object.keys(records).length;
  const streak = (() => {
    let count = 0;
    const d = new Date();
    while (true) {
      const s = toLocalDateStr(d);
      if (!records[s]) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  const selectedRecord = selectedDate ? (records[selectedDate] ?? null) : null;

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* 헤더 */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--foreground)" }}>
            Reading Garden
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            독서 기록을 잔디밭처럼 쌓아보세요
          </p>
        </div>

        {/* 통계 */}
        <div className="flex gap-6 mb-8">
          {[{ label: "총 기록일", value: totalDays }, { label: "연속 기록", value: `${streak}일` }].map(({ label, value }) => (
            <div key={label}>
              <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* 잔디밭 */}
        <div className="rounded-lg p-5 mb-3" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-medium mb-4" style={{ color: "var(--foreground)" }}>1년 기록 현황</h2>
          {loading ? (
            <div className="text-sm" style={{ color: "var(--muted)" }}>불러오는 중...</div>
          ) : (
            <ContributionGraph records={records} selectedDate={selectedDate} onDateClick={handleDateClick} />
          )}
        </div>

        {/* 날짜 클릭 시 기록 패널 */}
        {selectedDate && (
          <div
            className="rounded-lg p-5 mb-3"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", animation: "slideDown 0.15s ease" }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {formatDisplayDate(selectedDate)}
              </p>
              <button
                onClick={() => setModal({ type: "add" })}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium"
                style={{ backgroundColor: "var(--accent)", color: "#fff", cursor: "pointer" }}
              >
                <Pencil size={12} strokeWidth={2} />
                기록 추가
              </button>
            </div>

            {selectedRecord?.entries?.length ? (
              <div>
                {selectedRecord.entries.map((entry, i) => (
                  <div
                    key={entry.createdAt}
                    style={{
                      borderLeft: "2px solid var(--accent)",
                      paddingLeft: 12,
                      marginBottom: i < selectedRecord.entries.length - 1 ? 20 : 0,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p style={{ fontSize: 11, color: "var(--muted)" }}>
                        {i + 1}번째 기록 · {formatTime(entry.createdAt)}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setModal({ type: "edit", idx: i, initialContent: entry.content })}
                          style={{ fontSize: 11, color: "var(--muted)", cursor: "pointer" }}
                          className="hover:text-white transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(selectedDate, i)}
                          style={{ fontSize: 11, color: "var(--muted)", cursor: "pointer" }}
                          className="hover:text-red-400 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed" style={{ fontSize: 14, color: "var(--foreground)" }}>
                      {entry.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>이 날의 기록이 없습니다.</p>
            )}
          </div>
        )}
      </div>

      {/* 기록 작성/수정 모달 */}
      {modal && selectedDate && (
        <RecordWriteModal
          date={selectedDate}
          initialContent={modal.type === "edit" ? modal.initialContent : ""}
          onClose={() => setModal(null)}
          onSave={handleModalSave}
        />
      )}
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
