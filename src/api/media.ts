function normalizeApiBaseUrl(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value.trim().replace(/\/$/, "");
}

export const API_BASE_URL =
  normalizeApiBaseUrl(window.__WORMIE_CONFIG__?.API_BASE_URL) ||
  normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export function resolveApiAssetUrl(value: string, apiBaseUrl = API_BASE_URL): string {
  if (!value) {
    return value;
  }

  try {
    return new URL(value).toString();
  } catch {
    if (!apiBaseUrl) {
      return value;
    }

    return new URL(value, `${apiBaseUrl}/`).toString();
  }
}
