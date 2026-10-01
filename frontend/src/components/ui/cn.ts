import { twMerge } from "tailwind-merge";

/** Joins class names and lets later Tailwind classes override earlier ones (e.g. a Card's bg). */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return twMerge(classes.filter(Boolean).join(" "));
}
