/**
 Avoids repeated bugs from conflicting Tailwind classes.

Makes class management cleaner and more readable.

A common best practice in large Tailwind + React projects.
 */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
