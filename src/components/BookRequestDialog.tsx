import { useEffect, useState } from "react";

import type { BookSummary } from "../api/types";

interface BookRequestDialogProps {
  book: BookSummary;
  offeredBooks: BookSummary[];
  offeredBooksLoading: boolean;
  onClose: () => void;
  onSubmit: (payload: { requested_days?: number; offered_book_ids?: number[] }) => Promise<void>;
}

export function BookRequestDialog({
  book,
  offeredBooks,
  offeredBooksLoading,
  onClose,
  onSubmit
}: BookRequestDialogProps) {
  const [requestedDays, setRequestedDays] = useState(book.max_lend_days ?? 7);
  const [selectedOfferIds, setSelectedOfferIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOfferIds(offeredBooks.map((item) => item.id));
  }, [offeredBooks]);

  function toggleOffer(bookId: number) {
    setSelectedOfferIds((current) =>
      current.includes(bookId) ? current.filter((id) => id !== bookId) : [...current, bookId]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (book.share_mode === "LEND") {
        await onSubmit({ requested_days: requestedDays });
      } else {
        await onSubmit({ offered_book_ids: selectedOfferIds });
      }
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not send request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">{book.share_mode === "TRADE" ? "Barter request" : "Borrow request"}</p>
            <h2>{book.title}</h2>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          {book.share_mode === "LEND" ? (
            <label className="field">
              <span>How many days do you need this book?</span>
              <input
                className="text-input"
                type="number"
                min={1}
                max={book.max_lend_days ?? 365}
                value={requestedDays}
                onChange={(event) => setRequestedDays(Number(event.target.value))}
              />
            </label>
          ) : (
            <div className="field">
              <span>Select one or more of your trade books to offer.</span>
              {offeredBooksLoading ? <p className="helper">Loading your available trade books…</p> : null}
              {!offeredBooksLoading && offeredBooks.length === 0 ? (
                <p className="helper">You need at least one available trade listing before requesting this book.</p>
              ) : null}
              <div className="offer-grid">
                {offeredBooks.map((offeredBook) => (
                  <label key={offeredBook.id} className="offer-option">
                    <input
                      type="checkbox"
                      checked={selectedOfferIds.includes(offeredBook.id)}
                      onChange={() => toggleOffer(offeredBook.id)}
                    />
                    <div>
                      <strong>{offeredBook.title}</strong>
                      <span>{offeredBook.author}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error ? <p className="error-text">{error}</p> : null}

          <button
            type="submit"
            className="primary-button"
            disabled={submitting || (book.share_mode === "TRADE" && selectedOfferIds.length === 0)}
          >
            {submitting ? "Sending…" : "Send request"}
          </button>
        </form>
      </div>
    </div>
  );
}

