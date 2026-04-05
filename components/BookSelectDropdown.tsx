"use client";

import { useState, useRef, useEffect } from "react";
import { BookOpen, ChevronDown, Plus, X } from "lucide-react";
import type { Book, BooksData } from "@/lib/types";

interface Props {
  books: BooksData;
  selectedBookId: string | undefined;
  onChange: (bookId: string | undefined) => void;
  onBookCreate: (title: string, author: string) => Promise<Book>;
}

export default function BookSelectDropdown({ books, selectedBookId, onChange, onBookCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBook = selectedBookId ? books[selectedBookId] : null;
  const bookList = Object.values(books).sort((a, b) => a.title.localeCompare(b.title));

  useEffect(() => {
    if (!open) { setAdding(false); setNewTitle(""); setNewAuthor(""); }
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const book = await onBookCreate(newTitle.trim(), newAuthor.trim());
      onChange(book.id);
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 10px",
          borderRadius: 6,
          backgroundColor: "var(--background)",
          border: "1px solid var(--border)",
          color: selectedBook ? "var(--foreground)" : "var(--muted)",
          fontSize: 13,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <BookOpen size={14} strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedBook ? `${selectedBook.title}${selectedBook.author ? ` · ${selectedBook.author}` : ""}` : "책 선택 (선택 사항)"}
        </span>
        {selectedBook ? (
          <X
            size={13}
            strokeWidth={2}
            style={{ flexShrink: 0, color: "var(--muted)" }}
            onClick={(e) => { e.stopPropagation(); onChange(undefined); }}
          />
        ) : (
          <ChevronDown size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            zIndex: 200,
            overflow: "hidden",
            animation: "fadeIn 0.12s ease forwards",
          }}
        >
          {/* 책 없음 선택 */}
          <button
            type="button"
            onClick={() => { onChange(undefined); setOpen(false); }}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 13,
              color: "var(--muted)",
              textAlign: "left",
              cursor: "pointer",
              backgroundColor: !selectedBookId ? "var(--surface)" : "transparent",
            }}
          >
            선택 안 함
          </button>

          {bookList.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border)" }}>
              {bookList.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => { onChange(book.id); setOpen(false); }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 13,
                    color: "var(--foreground)",
                    textAlign: "left",
                    cursor: "pointer",
                    backgroundColor: selectedBookId === book.id ? "var(--surface)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ flex: 1 }}>{book.title}</span>
                  {book.author && <span style={{ fontSize: 11, color: "var(--muted)" }}>{book.author}</span>}
                  {book.status === "finished" && (
                    <span style={{ fontSize: 10, color: "var(--accent)", flexShrink: 0 }}>완독</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 새 책 추가 */}
          <div style={{ borderTop: "1px solid var(--border)" }}>
            {!adding ? (
              <button
                type="button"
                onClick={() => setAdding(true)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "var(--accent)",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Plus size={13} strokeWidth={2} />
                새 책 추가
              </button>
            ) : (
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                <input
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="제목"
                  style={{
                    width: "100%",
                    padding: "5px 8px",
                    fontSize: 13,
                    borderRadius: 5,
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--surface)",
                    color: "var(--foreground)",
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setAdding(false); }}
                />
                <input
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="저자 (선택)"
                  style={{
                    width: "100%",
                    padding: "5px 8px",
                    fontSize: 13,
                    borderRadius: 5,
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--surface)",
                    color: "var(--foreground)",
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setAdding(false); }}
                />
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setAdding(false)}
                    style={{ fontSize: 12, padding: "3px 10px", borderRadius: 5, cursor: "pointer", backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating || !newTitle.trim()}
                    style={{ fontSize: 12, padding: "3px 10px", borderRadius: 5, cursor: newTitle.trim() ? "pointer" : "not-allowed", backgroundColor: "var(--accent)", border: "none", color: "#fff", opacity: creating ? 0.7 : 1 }}
                  >
                    {creating ? "추가 중..." : "추가"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
