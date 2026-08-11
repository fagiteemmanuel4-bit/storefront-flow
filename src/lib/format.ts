export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Surfaces a human-readable message from any thrown value. Never swallows failures. */
export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown; error_description?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) return maybe.message;
    if (typeof maybe.error_description === "string" && maybe.error_description.trim()) {
      return maybe.error_description;
    }
  }
  return fallback;
}
