"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, X, BookOpen, Check } from "lucide-react";
import Toast, { type ToastData } from "@/components/Toast";
import type { BooksData, Book, RecordsData, RecordEntry } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function formatDisplayDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });
}

// 책별로 연결된 기록 수집
function getBookEntries(bookId: string, records: RecordsData): { date: string; entry: RecordEntry }[] {
  const result: { date: string; entry: RecordEntry }[] = [];
  for (const [date, record] of Object.entries(records)) {
    for (const entry of record.entries) {
      if (entry.bookId === bookId) result.push({ date, entry });
    }
  }
  return result.sort((a, b) => a.entry.createdAt.localeCompare(b.entry.createdAt));
}

function ShelfContent() {
  const [books, setBooks]     = useState<BooksData>({});
  const [records, setRecords] = useState<RecordsData>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState<ToastData | null>(null);
  const [addingBook, setAddingBook]   = useState(false);
  const [newTitle, setNewTitle]       = useState("");
  const [newAuthor, setNewAuthor]     = useState("");
  const [creating, setCreating]       = useState(false);
  const [togglingId, setTogglingId]   = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedBookId = searchParams.get("book");

  const showToast = useCallback((message: string, type: "success" | "delete" | "error") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/books").then((r) => r.json()),
      fetch("/api/records").then((r) => r.json()),
    ]).then(([booksData, recordsData]) => {
      setBooks(booksData);
      setRecords(recordsData);
    }).catch(() => {
      showToast("데이터를 불러오지 못했습니다.", "error");
    }).finally(() => setLoading(false));
  }, [showToast]);

  const handleCreateBook = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), author: newAuthor.trim() }),
      });
      if (!res.ok) throw new Error();
      const book: Book = await res.json();
      setBooks((prev) => ({ ...prev, [book.id]: book }));
      setNewTitle(""); setNewAuthor(""); setAddingBook(false);
      showToast("책을 추가했습니다.", "success");
    } catch {
      showToast("책 추가에 실패했습니다.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleFinished = async (id: string) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/books/${id}/toggle-finished`, { method: "POST" });
      if (!res.ok) throw new Error();
      const book: Book = await res.json();
      setBooks((prev) => ({ ...prev, [id]: book }));
    } catch {
      showToast("상태 변경에 실패했습니다.", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteBook = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setBooks((prev) => { const n = { ...prev }; delete n[id]; return n; });
      if (selectedBookId === id) router.replace("/shelf", { scroll: false });
      showToast("책을 삭제했습니다.", "delete");
    } catch {
      showToast("삭제에 실패했습니다.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectBook = (id: string) => {
    if (selectedBookId === id) router.replace("/shelf", { scroll: false });
    else router.replace(`/shelf?book=${id}`, { scroll: false });
  };

  const bookList = Object.values(books);
  const readingBooks  = bookList.filter((b) => b.status !== "finished");
  const finishedBooks = bookList.filter((b) => b.status === "finished");

  const selectedBook = selectedBookId ? books[selectedBookId] : null;
  const bookEntries  = selectedBookId ? getBookEntries(selectedBookId, records) : [];

  if (loading) {
    return (
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div style={{ color: "var(--muted)", fontSize: 14 }}>불러오는 중...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* 헤더 */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--foreground)" }}>서재</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>읽은 책들을 모아보세요</p>
          </div>
          <button
            onClick={() => setAddingBook(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium"
            style={{ backgroundColor: "var(--accent)", color: "#fff", cursor: "pointer", marginTop: 4 }}
          >
            <Plus size={12} strokeWidth={2} />
            책 추가
          </button>
        </div>

        {/* 책 추가 폼 */}
        {addingBook && (
          <div
            className="rounded-lg p-5 mb-4"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", animation: "slideDown 0.15s ease" }}
          >
            <p className="text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>새 책 추가</p>
            <div className="flex gap-2 mb-3">
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="제목 *"
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateBook(); if (e.key === "Escape") setAddingBook(false); }}
                style={{
                  flex: 1, padding: "7px 10px", fontSize: 13, borderRadius: 6,
                  border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)",
                }}
              />
              <input
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="저자 (선택)"
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateBook(); if (e.key === "Escape") setAddingBook(false); }}
                style={{
                  flex: 1, padding: "7px 10px", fontSize: 13, borderRadius: 6,
                  border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)",
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setAddingBook(false); setNewTitle(""); setNewAuthor(""); }}
                style={{ fontSize: 12, padding: "4px 12px", borderRadius: 5, cursor: "pointer", backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--muted)" }}
              >
                취소
              </button>
              <button
                onClick={handleCreateBook}
                disabled={creating || !newTitle.trim()}
                style={{ fontSize: 12, padding: "4px 12px", borderRadius: 5, cursor: newTitle.trim() ? "pointer" : "not-allowed", backgroundColor: "var(--accent)", border: "none", color: "#fff", opacity: creating ? 0.7 : 1 }}
              >
                {creating ? "추가 중..." : "추가"}
              </button>
            </div>
          </div>
        )}

        {bookList.length === 0 ? (
          <div
            className="rounded-lg p-10"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", textAlign: "center" }}
          >
            <BookOpen size={32} strokeWidth={1.5} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
            <p style={{ color: "var(--muted)", fontSize: 14 }}>아직 추가된 책이 없습니다.</p>
            <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>위의 &ldquo;책 추가&rdquo; 버튼으로 시작해보세요.</p>
          </div>
        ) : (
          <>
            {/* 읽는 중 */}
            {readingBooks.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-medium mb-3" style={{ color: "var(--muted)" }}>읽는 중 ({readingBooks.length})</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {readingBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      entryCount={getBookEntries(book.id, records).length}
                      selected={selectedBookId === book.id}
                      toggling={togglingId === book.id}
                      deleting={deletingId === book.id}
                      onSelect={() => handleSelectBook(book.id)}
                      onToggleFinished={() => handleToggleFinished(book.id)}
                      onDelete={() => handleDeleteBook(book.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 완독 */}
            {finishedBooks.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-medium mb-3" style={{ color: "var(--muted)" }}>완독 ({finishedBooks.length})</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {finishedBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      entryCount={getBookEntries(book.id, records).length}
                      selected={selectedBookId === book.id}
                      toggling={togglingId === book.id}
                      deleting={deletingId === book.id}
                      onSelect={() => handleSelectBook(book.id)}
                      onToggleFinished={() => handleToggleFinished(book.id)}
                      onDelete={() => handleDeleteBook(book.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 책 상세 패널 */}
        {selectedBook && (
          <div
            className="rounded-lg p-5"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", animation: "slideDown 0.15s ease" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{selectedBook.title}</h2>
                {selectedBook.author && <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{selectedBook.author}</p>}
                {selectedBook.finishedAt && (
                  <p style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>
                    완독 · {formatDate(selectedBook.finishedAt)}
                  </p>
                )}
              </div>
              <button
                onClick={() => router.replace("/shelf", { scroll: false })}
                style={{ color: "var(--muted)", cursor: "pointer", background: "none", border: "none", padding: 4, lineHeight: 1 }}
              >
                <X size={16} strokeWidth={1.8} />
              </button>
            </div>

            {bookEntries.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>아직 이 책에 연결된 기록이 없습니다.</p>
            ) : (
              <div>
                <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>기록 {bookEntries.length}개</p>
                {bookEntries.map(({ date, entry }, i) => (
                  <div
                    key={entry.createdAt}
                    style={{
                      borderLeft: "2px solid var(--accent)",
                      paddingLeft: 12,
                      marginBottom: i < bookEntries.length - 1 ? 20 : 0,
                    }}
                  >
                    <Link
                      href={`/?date=${date}`}
                      style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none", display: "inline-block", marginBottom: 4 }}
                      className="hover:underline"
                    >
                      {formatDisplayDate(date)}
                    </Link>
                    <p className="whitespace-pre-wrap leading-relaxed" style={{ fontSize: 14, color: "var(--foreground)" }}>
                      {entry.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </main>
  );
}

interface BookCardProps {
  book: Book;
  entryCount: number;
  selected: boolean;
  toggling: boolean;
  deleting: boolean;
  onSelect: () => void;
  onToggleFinished: () => void;
  onDelete: () => void;
}

function BookCard({ book, entryCount, selected, toggling, deleting, onSelect, onToggleFinished, onDelete }: BookCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      style={{
        backgroundColor: "var(--background)",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 10,
        padding: 14,
        cursor: "pointer",
        position: "relative",
        transition: "border-color 0.15s ease",
      }}
      onClick={onSelect}
    >
      {book.status === "finished" && (
        <span style={{
          position: "absolute", top: 10, right: 10,
          fontSize: 10, color: "var(--accent)",
          backgroundColor: "rgba(35,134,54,0.15)",
          border: "1px solid rgba(35,134,54,0.3)",
          borderRadius: 4, padding: "1px 5px",
        }}>
          완독
        </span>
      )}

      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 4, paddingRight: book.status === "finished" ? 36 : 0, wordBreak: "break-word" }}>
        {book.title}
      </p>
      {book.author && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>{book.author}</p>
      )}
      <p style={{ fontSize: 11, color: "var(--muted)" }}>기록 {entryCount}개</p>

      {/* 액션 버튼 */}
      <div
        className="flex gap-3"
        style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onToggleFinished}
          disabled={toggling}
          style={{ fontSize: 11, color: "var(--accent)", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, opacity: toggling ? 0.5 : 1 }}
        >
          <Check size={11} strokeWidth={2} />
          {book.status === "finished" ? "읽는 중으로" : "완독"}
        </button>

        {confirmDelete ? (
          <div className="flex gap-2" style={{ marginLeft: "auto" }}>
            <button onClick={() => setConfirmDelete(false)} style={{ fontSize: 11, color: "var(--muted)", cursor: "pointer" }}>취소</button>
            <button onClick={onDelete} disabled={deleting} style={{ fontSize: 11, color: "#c0392b", cursor: "pointer", opacity: deleting ? 0.5 : 1 }}>
              {deleting ? "삭제 중..." : "확인"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ fontSize: 11, color: "#c0392b", cursor: "pointer", marginLeft: "auto" }}
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}

export default function ShelfPage() {
  return (
    <Suspense>
      <ShelfContent />
    </Suspense>
  );
}
