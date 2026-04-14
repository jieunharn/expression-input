import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseTagList(raw: string): string[] {
  return raw
    .split(/[,#\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}
