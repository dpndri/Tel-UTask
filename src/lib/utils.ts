import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitas penggabungan kelas Tailwind dengan resolusi konflik otomatis
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
