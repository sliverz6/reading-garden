"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";

import ContributionGraph from "@/components/ContributionGraph";
import RecordWriteModal from "@/components/RecordWriteModal";
import Toast, { type ToastData } from "@/components/Toast";
import type { RecordsData, ReadingRecord, RecordEntry, BooksData, Book } from "@/lib/types";
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
  | { type: "edit"; idx: number; initialContent: string; initialBookId?: string };

function HomeContent() {
  const [records, setRecords] = useState<RecordsData>({});
  const [books, setBooks]     = useState<BooksData>({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState<ModalMode | null>(null);
  const [toast, setToast]       = useState<ToastData | null>(null);
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);
  const [confirmIdx, setConfirmIdx]   = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date");

  const showToast = useCallback((message: string, type: "success" | "delete" | "error") => {
    setToast({ message, type });
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const res  = await fetch("/api/records");
      const data: RecordsData = await res.json();
      setRecords(data);
    } catch {
      showToast("기록을 불러오지 못했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch("/api/books");
      const data: BooksData = await res.json();
      setBooks(data);
    } catch {
      // 책 목록 로딩 실패는 조용히 처리
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchBooks();
  }, [fetchRecords, fetchBooks]);

  // 날짜가 바뀌면 모달·확인 상태 초기화
  useEffect(() => { setModal(null); setConfirmIdx(null); }, [selectedDate]);

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
    if (!res.ok) throw new Error("server error");
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
    setConfirmIdx(null);
    setDeletingIdx(idx);
    try {
      await applyEntries(date, record.entries.filter((_, i) => i !== idx));
      showToast("삭제했습니다.", "delete");
    } catch {
      showToast("삭제에 실패했습니다.", "error");
    } finally {
      setDeletingIdx(null);
    }
  };

  const handleBookCreate = async (title: string, author: string): Promise<Book> => {
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author }),
    });
    if (!res.ok) throw new Error("server error");
    const book: Book = await res.json();
    setBooks((prev) => ({ ...prev, [book.id]: book }));
    return book;
  };

  /** 모달 onSave 핸들러 — 추가/수정 분기 */
  const handleModalSave = async (content: string, bookId?: string) => {
    if (!selectedDate) return;
    try {
      if (modal?.type === "edit") {
        const record = records[selectedDate];
        if (!record) return;
        const { idx } = modal;
        const newEntries = record.entries.map((e, i) =>
          i === idx ? { ...e, content, ...(bookId !== undefined ? { bookId } : { bookId: undefined }) } : e
        );
        await applyEntries(selectedDate, newEntries);
        showToast("수정했습니다.", "success");
      } else {
        const res = await fetch(`/api/records/${selectedDate}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, ...(bookId ? { bookId } : {}) }),
        });
        if (!res.ok) throw new Error("server error");
        const record: ReadingRecord = await res.json();
        setRecords((prev) => ({ ...prev, [record.date]: record }));
        showToast("저장했습니다.", "success");
      }
    } catch (err) {
      showToast("저장에 실패했습니다.", "error");
      throw err;
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

        {/* 통계 */}
        <div className="flex gap-6 mb-8">
          {[{ label: "총 기록일", value: `${totalDays}일` }, { label: "연속 기록", value: `${streak}일` }].map(({ label, value }) => (
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
                {selectedRecord.entries.map((entry, i) => {
                  const entryBook = entry.bookId ? books[entry.bookId] : null;
                  return (
                    <div
                      key={entry.createdAt}
                      style={{
                        borderLeft: "2px solid var(--accent)",
                        paddingLeft: 12,
                        marginBottom: i < selectedRecord.entries.length - 1 ? 20 : 0,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, lineHeight: 1 }}>
                          {i + 1}번째 기록 · {formatTime(entry.createdAt)}
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setModal({ type: "edit", idx: i, initialContent: entry.content, initialBookId: entry.bookId })}
                            style={{ fontSize: 11, color: "var(--muted)", cursor: "pointer", lineHeight: 1 }}
                            className="hover:text-white transition-colors"
                          >
                            수정
                          </button>
                          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <button
                              onClick={() => setConfirmIdx(confirmIdx === i ? null : i)}
                              disabled={deletingIdx === i}
                              style={{ fontSize: 11, color: "#c0392b", cursor: deletingIdx === i ? "not-allowed" : "pointer", opacity: deletingIdx === i ? 0.45 : 1, lineHeight: 1 }}
                            >
                              {deletingIdx === i ? "삭제 중..." : "삭제"}
                            </button>
                            {confirmIdx === i && (
                              <div
                                className="confirm-popup"
                                style={{
                                  position: "absolute",
                                  top: "50%",
                                  left: "calc(100% + 8px)",
                                  transform: "translateY(-50%)",
                                  backgroundColor: "var(--background)",
                                  border: "1px solid var(--border)",
                                  borderRadius: 8,
                                  padding: "10px 12px",
                                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                                  whiteSpace: "nowrap",
                                  zIndex: 50,
                                }}
                              >
                                <p style={{ fontSize: 12, color: "var(--foreground)", marginBottom: 8 }}>정말 삭제할까요?</p>
                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                  <button
                                    onClick={() => setConfirmIdx(null)}
                                    style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, cursor: "pointer", backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
                                  >
                                    취소
                                  </button>
                                  <button
                                    onClick={() => handleDelete(selectedDate, i)}
                                    style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, cursor: "pointer", backgroundColor: "#c0392b", border: "none", color: "#fff" }}
                                  >
                                    삭제
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 책 배지 */}
                      {entry.bookId && (
                        <div style={{ marginBottom: 6 }}>
                          {entryBook ? (
                            <Link
                              href={`/shelf?book=${entry.bookId}`}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                fontSize: 11, color: "var(--accent)", textDecoration: "none",
                                padding: "2px 7px", borderRadius: 4,
                                backgroundColor: "rgba(35,134,54,0.15)",
                                border: "1px solid rgba(35,134,54,0.3)",
                              }}
                            >
                              📚 {entryBook.title}{entryBook.author ? ` · ${entryBook.author}` : ""}
                            </Link>
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>삭제된 책</span>
                          )}
                        </div>
                      )}

                      <p className="whitespace-pre-wrap leading-relaxed" style={{ fontSize: 14, color: "var(--foreground)" }}>
                        {entry.content}
                      </p>
                    </div>
                  );
                })}
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
          initialBookId={modal.type === "edit" ? modal.initialBookId : undefined}
          books={books}
          onClose={() => setModal(null)}
          onSave={handleModalSave}
          onBookCreate={handleBookCreate}
        />
      )}

      {/* 토스트 알림 */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
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
