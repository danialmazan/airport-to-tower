import { readFile, writeFile } from 'node:fs/promises';
import Papa from 'papaparse';

type AirportRow = Record<string, string> & { iata: string };
type DemandRow = { iata: string; annual_passengers: string; passenger_year: string; source_id: string };

const curatedUrl = new URL('../data/curated/airports.csv', import.meta.url);
const demandUrl = new URL('../data/snapshots/airport-passenger-demand-2025.csv', import.meta.url);
const wikidataDemandUrl = new URL('../data/snapshots/wikidata-airport-passenger-demand-2026-09-17.csv', import.meta.url);

async function main() {
  const [airportText, demandText, wikidataDemandText] = await Promise.all([readFile(curatedUrl, 'utf8'), readFile(demandUrl, 'utf8'), readFile(wikidataDemandUrl, 'utf8')]);
  const airports = Papa.parse<AirportRow>(airportText, { header: true, skipEmptyLines: true });
  const demand = Papa.parse<DemandRow>(demandText, { header: true, skipEmptyLines: true });
  const wikidataDemand = Papa.parse<DemandRow>(wikidataDemandText, { header: true, skipEmptyLines: true });
  if (airports.errors.length || demand.errors.length || wikidataDemand.errors.length) throw new Error('Unable to parse airport demand inputs.');
  const byIata = new Map(wikidataDemand.data.map((row) => [row.iata, row]));
  demand.data.forEach((row) => byIata.set(row.iata, row));
  const enriched = airports.data.map((airport) => {
    const match = byIata.get(airport.iata);
    return {
      airport_id: airport.airport_id,
      airport_name: airport.airport_name,
      airport_name_es: airport.airport_name_es,
      iata: airport.iata,
      icao: airport.icao,
      latitude: airport.latitude,
      longitude: airport.longitude,
      airport_type: airport.airport_type,
      annual_passengers_m: match ? String(Number(match.annual_passengers) / 1_000_000) : '',
      passenger_year: match?.passenger_year ?? '',
      passenger_source_id: match?.source_id ?? '',
      coordinate_source_id: airport.coordinate_source_id,
      reviewed_at: airport.reviewed_at,
    };
  });
  await writeFile(curatedUrl, `${Papa.unparse(enriched, { newline: '\n' })}\n`);
  console.log(`Added sourced passenger demand to ${enriched.filter((row) => row.annual_passengers_m).length} of ${enriched.length} airports; official snapshot values take precedence over Wikidata fallbacks.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
