import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEur(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactEur(value: number): string {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(1)}k`;
  return formatEur(value);
}

/** @deprecated use formatEur */
export function formatCurrency(value: number): string {
  return formatEur(value);
}

/** @deprecated use formatCompactEur */
export function formatCompact(value: number): string {
  return formatCompactEur(value);
}

export function hubspotDealUrl(portalId: string | undefined, dealId: string): string | null {
  const p = (portalId ?? "").trim();
  if (!p) return null;
  return `https://app.hubspot.com/contacts/${p}/deal/${dealId}`;
}

export function formatDisplayDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
