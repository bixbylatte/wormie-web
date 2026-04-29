import { useMemo, useState } from "react";
import { ArrowRightLeft, BookUser, CalendarDays, CircleCheckBig, Clock3, ShieldCheck, UserRound } from "lucide-react";

import type { ShareRequestSummary } from "../api/types";
import { formatDate, isOverdue } from "../lib/dates";

interface RequestCardProps {
  request: ShareRequestSummary;
  perspective: "incoming" | "outgoing";
  onApprove?: (requestId: number, selectedOfferedBookId?: number) => Promise<void>;
  onReject?: (requestId: number) => Promise<void>;
  onReturn?: (requestId: number) => Promise<void>;
  onComplete?: (requestId: number) => Promise<void>;
  busy: boolean;
}

export function RequestCard({
  request,
  perspective,
  onApprove,
  onReject,
  onReturn,
  onComplete,
  busy
}: RequestCardProps) {
  const defaultOffer = useMemo(
    () => request.selected_offered_book_id ?? request.offered_books[0]?.id ?? undefined,
    [request.offered_books, request.selected_offered_book_id]
  );
  const [selectedOffer, setSelectedOffer] = useState<number | undefined>(defaultOffer);

  const lendIsOverdue = request.share_mode === "LEND" && request.status === "APPROVED" && isOverdue(request.due_date);

  return (
    <article className="request-card">
      <div className="request-header">
        <div>
          <span className={`pill pill-${request.share_mode.toLowerCase()}`}>
            {request.share_mode === "TRADE" ? "Trade request" : "Lend request"}
          </span>
          <h3>{request.book.title}</h3>
        </div>
        <span className={`status-chip status-${request.status.toLowerCase()}`}>{request.status}</span>
      </div>

      <div className="request-grid">
        <p className="request-row">
          <UserRound size={16} />
          {perspective === "incoming" ? `Requested by ${request.requester.display_name}` : `Owned by ${request.owner.display_name}`}
        </p>
        <p className="request-row">
          <BookUser size={16} />
          {request.book.author}
        </p>
        <p className="request-row">
          <CalendarDays size={16} />
          Requested on {formatDate(request.created_at)}
        </p>
        {request.share_mode === "LEND" ? (
          <p className="request-row">
            <Clock3 size={16} />
            {request.requested_days} days requested
          </p>
        ) : null}
        {request.share_mode === "LEND" && request.due_date ? (
          <p className={`request-row${lendIsOverdue ? " overdue" : ""}`}>
            <ShieldCheck size={16} />
            Due {formatDate(request.due_date)}{lendIsOverdue ? " • Overdue" : ""}
          </p>
        ) : null}
      </div>

      {request.share_mode === "TRADE" ? (
        <div className="offer-summary">
          <p className="section-label">
            <ArrowRightLeft size={16} />
            Offered books
          </p>
          <div className="offer-grid">
            {request.offered_books.map((book) => (
              <label key={book.id} className="offer-option">
                <input
                  type="radio"
                  name={`offer-${request.id}`}
                  checked={selectedOffer === book.id}
                  onChange={() => setSelectedOffer(book.id)}
                  disabled={request.status !== "PENDING" || perspective !== "incoming"}
                />
                <div>
                  <strong>{book.title}</strong>
                  <span>{book.author}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {perspective === "incoming" ? (
        <div className="request-actions">
          {request.status === "PENDING" ? (
            <>
              <button
                type="button"
                className="primary-button"
                disabled={busy}
                onClick={() => onApprove?.(request.id, selectedOffer)}
              >
                Approve
              </button>
              <button type="button" className="secondary-button" disabled={busy} onClick={() => onReject?.(request.id)}>
                Reject
              </button>
            </>
          ) : null}

          {request.status === "APPROVED" && request.share_mode === "LEND" ? (
            <button type="button" className="primary-button" disabled={busy} onClick={() => onReturn?.(request.id)}>
              Mark Returned
            </button>
          ) : null}

          {request.status === "APPROVED" && request.share_mode === "TRADE" ? (
            <button type="button" className="primary-button" disabled={busy} onClick={() => onComplete?.(request.id)}>
              Complete Trade
            </button>
          ) : null}
        </div>
      ) : request.status === "COMPLETED" ? (
        <p className="request-row">
          <CircleCheckBig size={16} />
          Trade completed
        </p>
      ) : null}
    </article>
  );
}

