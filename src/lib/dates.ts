export function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function isOverdue(value: string | null) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}

