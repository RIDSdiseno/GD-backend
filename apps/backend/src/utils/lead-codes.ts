// src/utils/lead-codes.ts
export function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function getInitialsFromName(full: string): { first: string; last: string } {
  const clean = stripDiacritics((full ?? "").trim()).replace(/\s+/g, " ");
  if (!clean) return { first: "X", last: "X" };

  const parts = clean.split(" ");
  const firstWord = parts[0] ?? "";
  const lastWord = parts.length > 1 ? (parts[parts.length - 1] ?? "") : "";

  // charAt devuelve siempre string ("" si no hay char), así evitamos 'possibly undefined'
  const first = (firstWord.charAt(0) || "X").toUpperCase();
  const last  = ((lastWord ? lastWord.charAt(0) : firstWord.charAt(1)) || "X").toUpperCase();

  return { first, last };
}

export function zeroPad(n: number, width = 5) {
  return String(n).padStart(width, "0");
}

export function cotizacionFromId(now: Date, id: number): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `COT-${yyyy}${mm}-${String(id).padStart(6, "0")}`;
}
