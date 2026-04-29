export type ShareMode = "TRADE" | "LEND";
export type ListingStatus = "AVAILABLE" | "UNAVAILABLE" | "ARCHIVED";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED" | "COMPLETED";

export interface UserSummary {
  id: number;
  display_name: string;
  email: string;
}

export interface AuthPayload {
  token: string;
  user: UserSummary;
}

export interface BookSummary {
  id: number;
  share_mode: ShareMode;
  status: ListingStatus;
  max_lend_days: number | null;
  title: string;
  author: string;
  genre: string | null;
  details_url: string | null;
  cover_url: string;
  created_at: string;
  owner: UserSummary;
}

export interface BookListResponse {
  items: BookSummary[];
}

export interface ShareRequestSummary {
  id: number;
  status: RequestStatus;
  share_mode: ShareMode;
  requested_days: number | null;
  due_date: string | null;
  created_at: string;
  book: BookSummary;
  requester: UserSummary;
  owner: UserSummary;
  offered_books: BookSummary[];
  selected_offered_book_id: number | null;
}

export interface GroupedRequestsResponse {
  your_requests: ShareRequestSummary[];
  requests_from_others: ShareRequestSummary[];
}

