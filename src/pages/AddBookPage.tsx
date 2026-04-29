import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { booksApi } from "../api/client";
import { useAuth } from "../hooks/useAuth";

export function AddBookPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [shareMode, setShareMode] = useState<"TRADE" | "LEND">("TRADE");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [detailsUrl, setDetailsUrl] = useState("");
  const [maxLendDays, setMaxLendDays] = useState(14);
  const [cover, setCover] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !cover) {
      setError("Please upload a book cover before sharing.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("share_mode", shareMode);
      formData.append("title", title);
      formData.append("author", author);
      formData.append("genre", genre);
      formData.append("details_url", detailsUrl);
      if (shareMode === "LEND") {
        formData.append("max_lend_days", String(maxLendDays));
      }
      formData.append("cover", cover);
      await booksApi.create(token, formData);
      navigate("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not share this book.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="form-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Add a book</p>
          <h2>Share something from your shelf</h2>
        </div>
      </div>

      <form className="form-card form-stack" onSubmit={handleSubmit}>
        <div className="segmented-control">
          <button type="button" className={shareMode === "TRADE" ? "active" : ""} onClick={() => setShareMode("TRADE")}>
            For Trade
          </button>
          <button type="button" className={shareMode === "LEND" ? "active" : ""} onClick={() => setShareMode("LEND")}>
            For Lend
          </button>
        </div>

        {shareMode === "LEND" ? (
          <label className="field">
            <span>Maximum number of days</span>
            <input
              className="text-input"
              type="number"
              min={1}
              value={maxLendDays}
              onChange={(event) => setMaxLendDays(Number(event.target.value))}
              required
            />
          </label>
        ) : null}

        <label className="field">
          <span>Book title</span>
          <input className="text-input" type="text" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>

        <label className="field">
          <span>Book author</span>
          <input className="text-input" type="text" value={author} onChange={(event) => setAuthor(event.target.value)} required />
        </label>

        <label className="field">
          <span>Book genre</span>
          <input className="text-input" type="text" value={genre} onChange={(event) => setGenre(event.target.value)} />
        </label>

        <label className="field">
          <span>Link to book details</span>
          <input className="text-input" type="url" value={detailsUrl} onChange={(event) => setDetailsUrl(event.target.value)} />
        </label>

        <label className="field">
          <span>Upload book cover</span>
          <input className="file-input" type="file" accept="image/*" onChange={(event) => setCover(event.target.files?.[0] ?? null)} required />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? "Sharing…" : "Share my book"}
        </button>
      </form>
    </section>
  );
}

