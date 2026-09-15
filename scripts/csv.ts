import { readFile } from 'node:fs/promises';
import Papa from 'papaparse';

export async function readCsv<T>(file: URL): Promise<T[]> {
  const text = await readFile(file, 'utf8');
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) throw new Error(`${file.pathname}: ${parsed.errors.map((error) => error.message).join('; ')}`);
  return parsed.data.map((row) => coerce(row) as T);
}

function coerce(row: Record<string, string>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => {
    const trimmed = value.trim();
    if (trimmed === 'true') return [key, true];
    if (trimmed === 'false') return [key, false];
    if (/^-?\d+(\.\d+)?$/.test(trimmed) && !['iata', 'icao', 'country_code'].includes(key)) return [key, Number(trimmed)];
    return [key, trimmed];
  }));
}
