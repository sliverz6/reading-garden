import { kv } from "@vercel/kv";
import type { Book, BooksData, BookStatus } from "./types";

const key = (id: string) => `book:${id}`;

export async function getAllBooks(): Promise<BooksData> {
  const keys = await kv.keys("book:*");
  if (!keys.length) return {};
  const values = await kv.mget<Book[]>(...keys);
  const result: BooksData = {};
  values.forEach((book) => {
    if (book) result[book.id] = book;
  });
  return result;
}

export async function getBook(id: string): Promise<Book | null> {
  return kv.get<Book>(key(id));
}

export async function createBook(title: string, author: string): Promise<Book> {
  const book: Book = {
    id: crypto.randomUUID(),
    title,
    author,
    status: "reading",
    createdAt: new Date().toISOString(),
  };
  await kv.set(key(book.id), book);
  return book;
}

export async function updateBook(
  id: string,
  patch: Partial<Pick<Book, "title" | "author" | "status" | "finishedAt">>
): Promise<Book> {
  const existing = await getBook(id);
  if (!existing) throw new Error("Book not found");
  const updated: Book = { ...existing, ...patch };
  await kv.set(key(id), updated);
  return updated;
}

export async function toggleFinished(id: string): Promise<Book> {
  const book = await getBook(id);
  if (!book) throw new Error("Book not found");
  if (book.status === "finished") {
    return updateBook(id, { status: "reading", finishedAt: undefined });
  }
  return updateBook(id, { status: "finished", finishedAt: new Date().toISOString() });
}

export async function deleteBook(id: string): Promise<void> {
  await kv.del(key(id));
}
