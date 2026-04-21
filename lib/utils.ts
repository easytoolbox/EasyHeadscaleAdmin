import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export function maskSecret(secret: string) {
  if (secret.length <= 8) return "••••••••";
  return `${secret.slice(0, 4)}••••${secret.slice(-4)}`;
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
