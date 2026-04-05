"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import BookSelectDropdown from "./BookSelectDropdown";
import type { Book, BooksData } from "@/lib/types";

interface Props {
  date: string;
  initialContent?: string;
  initialBookId?: string;
  books: BooksData;
  onClose: () => void;
  onSave: (content: string, bookId?: string) => Promise<void>;
  onBookCreate: (title: string, author: string) => Promise<Book>;
}

function formatDisplayDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });
}

export default function RecordWriteModal({ date, initialContent = "", initialBookId, books, onClose, onSave, onBookCreate }: Props) {
  const [content, setContent]     = useState(initialContent);
  const [bookId, setBookId]       = useState<string | undefined>(initialBookId);
  const [saving, setSaving]       = useState(false);
  const [closing, setClosing] = useState(false);
  const textareaRef           = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      textareaRef.current?.focus();
      // 기존 내용이 있으면 커서를 끝으로
      if (initialContent) {
        const el = textareaRef.current;
        if (el) { el.selectionStart = el.selectionEnd = el.value.length; }
      }
    }, 50);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 180);
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onSave(content, bookId);
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSave();
  };

  const charCount = content.length;
  const charLabel =
    charCount < 50  ? "씨앗 🌱" :
    charCount < 150 ? "새싹 🌿" :
    charCount < 300 ? "나무 🌳" :
    "숲 🌲";

  return (
    <div
      className={`modal-overlay${closing ? " closing" : ""}`}
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "24px 16px",
      }}
    >
      <div
        className={`modal-content${closing ? " closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 640,
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 28,
        }}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-6">
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)" }}>
            {formatDisplayDate(date)}
          </h2>
          <button
            onClick={handleClose}
            style={{ color: "var(--muted)", cursor: "pointer", background: "none", border: "none", padding: 4, lineHeight: 1 }}
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* 책 선택 */}
        <div className="mb-4">
          <BookSelectDropdown
            books={books}
            selectedBookId={bookId}
            onChange={setBookId}
            onBookCreate={onBookCreate}
          />
        </div>

        {/* 입력 */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="오늘 읽은 책, 인상 깊었던 구절, 느낀 점을 자유롭게 기록해보세요..."
          rows={10}
          className="w-full resize-none rounded-md px-3 py-2.5 text-sm leading-relaxed"
          style={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            caretColor: "var(--foreground)",
          }}
        />

        {/* 하단 */}
        <div className="flex items-center justify-between mt-3">
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {charCount}자
            {charCount > 0 && <span className="ml-2">· {charLabel}</span>}
          </span>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="text-sm px-4 py-1.5 rounded-md font-medium"
            style={{
              backgroundColor: content.trim() ? "var(--accent)" : "var(--border)",
              color: content.trim() ? "#fff" : "var(--muted)",
              cursor: content.trim() ? "pointer" : "not-allowed",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
          Ctrl+Enter 로 저장 · ESC 로 닫기
        </p>
      </div>
    </div>
  );
}
