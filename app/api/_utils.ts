import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError, toAppError } from "@/lib/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request payload",
          detail: error.flatten()
        }
      },
      { status: 400 }
    );
  }

  const appError = toAppError(error);
  return NextResponse.json(
    {
      error: {
        code: appError.code,
        message: appError.message,
        detail: appError.detail
      }
    },
    { status: appError.status }
  );
}

export function assertId(value: string | undefined, name = "id") {
  if (!value) {
    throw new AppError(`${name} is required`, 400, "MISSING_ID");
  }
  return value;
}
