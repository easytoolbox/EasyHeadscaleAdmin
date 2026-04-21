export class AppError extends Error {
  constructor(
    message: string,
    public status = 500,
    public code = "INTERNAL_ERROR",
    public detail?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toAppError(error: unknown, fallback = "Unexpected server error") {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError(error.message || fallback);
  }
  return new AppError(fallback);
}
