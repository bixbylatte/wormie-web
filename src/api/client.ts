import type {
  AuthPayload,
  BookListResponse,
  BookSummary,
  GroupedRequestsResponse,
  ListingStatus,
  ShareRequestSummary,
  ShareMode,
  UserSummary
} from "./types";
import { API_BASE_URL, resolveApiAssetUrl } from "./media";

function normalizeBookSummary(book: BookSummary): BookSummary {
  return {
    ...book,
    cover_url: resolveApiAssetUrl(book.cover_url)
  };
}

function normalizeBookListResponse(response: BookListResponse): BookListResponse {
  return {
    ...response,
    items: response.items.map(normalizeBookSummary)
  };
}

function normalizeShareRequestSummary(response: ShareRequestSummary): ShareRequestSummary {
  return {
    ...response,
    book: normalizeBookSummary(response.book),
    offered_books: response.offered_books.map(normalizeBookSummary)
  };
}

function normalizeGroupedRequestsResponse(response: GroupedRequestsResponse): GroupedRequestsResponse {
  return {
    your_requests: response.your_requests.map(normalizeShareRequestSummary),
    requests_from_others: response.requests_from_others.map(normalizeShareRequestSummary)
  };
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ApiValidationDetail = {
  ctx?: Record<string, unknown>;
  loc?: Array<string | number>;
  msg?: string;
  type?: string;
};

function formatApiErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "Request failed.";
  }

  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const validationDetail = item as ApiValidationDetail;
        if (validationDetail.loc?.includes("password") && validationDetail.type === "string_too_short") {
          return "Password must be at least 8 characters.";
        }

        return validationDetail.msg ?? null;
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return "Request failed.";
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(formatApiErrorMessage(data), response.status);
  }

  return (await response.json()) as T;
}

export const authApi = {
  register(input: { display_name: string; email: string; password: string }) {
    return request<AuthPayload>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  login(input: { email: string; password: string }) {
    return request<AuthPayload>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  me(token: string) {
    return request<UserSummary>("/api/v1/auth/me", {}, token);
  }
};

export const booksApi = {
  list(token: string, options?: { includeUnavailable?: boolean; mineOnly?: boolean; shareMode?: ShareMode }) {
    const params = new URLSearchParams();
    if (options?.includeUnavailable) params.set("include_unavailable", "true");
    if (options?.mineOnly) params.set("mine_only", "true");
    if (options?.shareMode) params.set("share_mode", options.shareMode);
    const query = params.toString();
    return request<BookListResponse>(`/api/v1/books${query ? `?${query}` : ""}`, {}, token).then(normalizeBookListResponse);
  },
  create(token: string, payload: FormData) {
    return request<BookSummary>("/api/v1/books", { method: "POST", body: payload }, token).then(normalizeBookSummary);
  },
  updateAvailability(token: string, bookId: number, status: ListingStatus) {
    return request<BookSummary>(
      `/api/v1/books/${bookId}/availability`,
      {
        method: "PATCH",
        body: JSON.stringify({ status })
      },
      token
    ).then(normalizeBookSummary);
  }
};

export const requestsApi = {
  create(token: string, bookId: number, input: { requested_days?: number; offered_book_ids?: number[] }) {
    return request<ShareRequestSummary>(
      `/api/v1/requests/books/${bookId}`,
      {
        method: "POST",
        body: JSON.stringify(input)
      },
      token
    ).then(normalizeShareRequestSummary);
  },
  list(token: string) {
    return request<GroupedRequestsResponse>("/api/v1/requests", {}, token).then(normalizeGroupedRequestsResponse);
  },
  approve(token: string, requestId: number, selectedOfferedBookId?: number) {
    return request<ShareRequestSummary>(
      `/api/v1/requests/${requestId}/approve`,
      {
        method: "POST",
        body: JSON.stringify({ selected_offered_book_id: selectedOfferedBookId ?? null })
      },
      token
    ).then(normalizeShareRequestSummary);
  },
  reject(token: string, requestId: number) {
    return request<ShareRequestSummary>(`/api/v1/requests/${requestId}/reject`, { method: "POST" }, token).then(normalizeShareRequestSummary);
  },
  returnLend(token: string, requestId: number) {
    return request<ShareRequestSummary>(`/api/v1/requests/${requestId}/return`, { method: "POST" }, token).then(normalizeShareRequestSummary);
  },
  completeTrade(token: string, requestId: number) {
    return request<ShareRequestSummary>(`/api/v1/requests/${requestId}/complete`, { method: "POST" }, token).then(normalizeShareRequestSummary);
  }
};
