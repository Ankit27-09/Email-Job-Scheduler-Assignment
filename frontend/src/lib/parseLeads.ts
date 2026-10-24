import Papa from "papaparse";

const EMAIL_IN_TEXT = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const EMAIL_EXACT = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export interface ParsedLeads {
  emails: string[];
  duplicates: number;
  invalidRows: number;
}

export const isValidEmail = (value: string) => EMAIL_EXACT.test(value.trim());

/*
 * Accepts any CSV or plain-text list. Every cell is scanned for addresses, so it
 * works with or without a header row and with the email in any column.
 * Rows without an address are counted as invalid rather than failing the upload.
 */
export async function parseLeadsFile(file: File): Promise<ParsedLeads> {
  const text = await file.text();
  const { data } = Papa.parse<string[]>(text, { skipEmptyLines: true });

  const seen = new Set<string>();
  let duplicates = 0;
  let invalidRows = 0;

  for (const row of data) {
    const matches = row.join(" ").match(EMAIL_IN_TEXT);
    if (!matches) {
      // A header row like "email,name" is expected and not worth reporting.
      if (!row.some((cell) => /e-?mail/i.test(cell))) invalidRows++;
      continue;
    }
    for (const raw of matches) {
      const email = raw.toLowerCase();
      if (seen.has(email)) duplicates++;
      else seen.add(email);
    }
  }

  return { emails: [...seen], duplicates, invalidRows };
}
