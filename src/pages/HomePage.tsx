import { useEffect, useState } from "react";
import { BookCopy, Filter } from "lucide-react";

import { booksApi, requestsApi } from "../api/client";
import type { BookSummary } from "../api/types";
import { BookCard } from "../components/BookCard";
import { BookRequestDialog } from "../components/BookRequestDialog";
import { useAuth } from "../hooks/useAuth";

export function HomePage() {
  const { token, user } = useAuth();
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [tradeBooks, setTradeBooks] = useState<BookSummary[]>([]);
  const [includeUnavailable, setIncludeUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyBookId, setBusyBookId] = useState<number | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tradeBookLoading, setTradeBookLoading] = useState(false);

  async function loadBooks() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await booksApi.list(token, { includeUnavailable });
      setBooks(response.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the bookshelf.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBooks();
  }, [includeUnavailable, token]);

  async function openRequestDialog(book: BookSummary) {
    setSelectedBook(book);
    if (book.share_mode === "TRADE" && token) {
      setTradeBookLoading(true);
      try {
        const response = await booksApi.list(token, { mineOnly: true, shareMode: "TRADE" });
        setTradeBooks(response.items);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not load your trade books.");
      } finally {
        setTradeBookLoading(false);
      }
    } else {
      setTradeBooks([]);
    }
  }

  async function handleRequestSubmit(payload: { requested_days?: number; offered_book_ids?: number[] }) {
    if (!token || !selectedBook) return;
    await requestsApi.create(token, selectedBook.id, payload);
    await loadBooks();
  }

  async function handleToggleAvailability(book: BookSummary) {
    if (!token) return;
    setBusyBookId(book.id);
    setError(null);
    try {
      const nextStatus = book.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
      await booksApi.updateAvailability(token, book.id, nextStatus);
      await loadBooks();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Could not update availability.");
    } finally {
      setBusyBookId(null);
    }
  }

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">Bookshelf</p>
          <h2>Browse what your team is ready to share</h2>
        </div>
        <button type="button" className="secondary-button filter-button" onClick={() => setIncludeUnavailable((value) => !value)}>
          <Filter size={16} />
          {includeUnavailable ? "Showing all listings" : "Available only"}
        </button>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      {loading ? (
        <div className="empty-state">
          <BookCopy size={28} />
          <p>Loading your bookshelf…</p>
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <BookCopy size={28} />
          <p>No books match this filter yet.</p>
        </div>
      ) : (
        <section className="bookshelf-grid">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              isOwner={book.owner.id === user?.id}
              isBusy={busyBookId === book.id}
              onRequest={openRequestDialog}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </section>
      )}

      {selectedBook ? (
        <BookRequestDialog
          book={selectedBook}
          offeredBooks={tradeBooks}
          offeredBooksLoading={tradeBookLoading}
          onClose={() => setSelectedBook(null)}
          onSubmit={handleRequestSubmit}
        />
      ) : null}
    </>
  );
}
