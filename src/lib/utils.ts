import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Removes leading zeros from a numeric string and returns the parsed number.
 * Examples: "0500" -> 500, "00.5" -> 0.5, "0" -> 0
 */
export function parseNumericInput(value: string): number {
  if (!value || value === "") return 0;
  
  // Remove leading zeros but preserve decimal values
  const cleaned = value.replace(/^0+(?=\d)/, "");
  const parsed = parseFloat(cleaned || "0");
  
  return isNaN(parsed) ? 0 : parsed;
}
