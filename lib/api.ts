import { AppError } from "@/lib/errors";
import { withBasePath } from "@/lib/base-path";

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const requestUrl = withBasePath(input);

  try {
    response = await fetch(requestUrl, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      }
    });
  } catch (error) {
    throw new AppError(
      error instanceof Error && error.message ? `Unable to reach the server: ${error.message}` : "Unable to reach the server",
      503,
      "NETWORK_ERROR"
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AppError(payload?.error?.message ?? "Request failed", response.status, payload?.error?.code);
  }

  return payload.data as T;
}
