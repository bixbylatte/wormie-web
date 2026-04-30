import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BookCard } from "./BookCard";

const book = {
  id: 1,
  share_mode: "LEND" as const,
  status: "AVAILABLE" as const,
  max_lend_days: 14,
  title: "Talent",
  author: "Tyler Cowen",
  genre: "Management",
  details_url: "https://example.com/books/talent",
  cover_url: "https://storage.googleapis.com/wormie/covers/cover.avif",
  created_at: "2026-04-30T00:00:00Z",
  owner: {
    id: 2,
    display_name: "bixby",
    email: "bob.bbvillarin@gmail.com"
  }
};

describe("BookCard", () => {
  it("shows a placeholder when the cover image fails to load", () => {
    render(
      <BookCard
        book={book}
        isOwner={false}
        isBusy={false}
        onRequest={vi.fn()}
        onToggleAvailability={vi.fn()}
      />
    );

    fireEvent.error(screen.getByAltText("Talent cover"));

    expect(screen.getByLabelText("Talent cover unavailable")).toBeInTheDocument();
    expect(screen.queryByAltText("Talent cover")).not.toBeInTheDocument();
  });
});
