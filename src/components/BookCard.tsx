import { BookOpenText, Clock3, Link2, Repeat2, UserRound } from "lucide-react";

import type { BookSummary } from "../api/types";

interface BookCardProps {
  book: BookSummary;
  isOwner: boolean;
  onRequest: (book: BookSummary) => void;
  onToggleAvailability: (book: BookSummary) => void;
  isBusy: boolean;
}

export function BookCard({ book, isOwner, onRequest, onToggleAvailability, isBusy }: BookCardProps) {
  const available = book.status === "AVAILABLE";
  const requestDisabled = !available || isOwner || isBusy;

  return (
    <article className="book-card">
      <div className="card-pill-row">
        <span className={`pill pill-${book.share_mode.toLowerCase()}`}>
          {book.share_mode === "TRADE" ? "For Trade" : "For Lend"}
        </span>
        <span className={`availability availability-${available ? "open" : "closed"}`}>
          {available ? "Available" : "Unavailable"}
        </span>
      </div>

      <div className="cover-frame">
        <img src={book.cover_url} alt={`${book.title} cover`} className="cover-image" />
      </div>

      <div className="book-meta">
        <div className="meta-line">
          <BookOpenText size={16} />
          <div>
            <strong>{book.title}</strong>
            <span>{book.author}</span>
          </div>
        </div>

        <div className="meta-inline">
          <span className="meta-tag">
            <Repeat2 size={14} />
            {book.genre || "Genre optional"}
          </span>
          {book.share_mode === "LEND" && book.max_lend_days ? (
            <span className="meta-tag">
              <Clock3 size={14} />
              {book.max_lend_days} days max
            </span>
          ) : null}
        </div>

        <div className="meta-line">
          <UserRound size={16} />
          <span>{book.owner.display_name}</span>
        </div>

        {book.details_url ? (
          <a href={book.details_url} className="details-link" target="_blank" rel="noreferrer">
            <Link2 size={14} />
            Book details
          </a>
        ) : null}
      </div>

      <div className="card-actions">
        {isOwner ? (
          <button type="button" className="secondary-button" onClick={() => onToggleAvailability(book)} disabled={isBusy}>
            Mark {available ? "Unavailable" : "Available"}
          </button>
        ) : null}
        <button type="button" className="primary-button" onClick={() => onRequest(book)} disabled={requestDisabled}>
          {isOwner ? "Your listing" : available ? "Request Share" : "Unavailable"}
        </button>
      </div>
    </article>
  );
}

