import { readFile, writeFile } from 'node:fs/promises';
import Papa from 'papaparse';

type AirportRow = { iata: string; annual_passengers_m: string };
type Binding = {
  iata: { value: string };
  airport: { value: string };
  passengers: { value: string };
  date: { value: string };
  precision: { value: string };
};

const airportsUrl = new URL('../data/curated/airports.csv', import.meta.url);
const outputUrl = new URL('../data/snapshots/wikidata-airport-passenger-demand-2026-09-17.csv', import.meta.url);
const endpoint = 'https://query.wikidata.org/sparql';
const sourceId = 'wikidata-airport-traffic-2026-09-17';

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function queryBatch(iatas: string[], attempt = 1): Promise<Binding[]> {
  const values = iatas.map((iata) => `"${iata}"`).join(' ');
  const query = `SELECT ?iata ?airport ?passengers ?date ?precision WHERE {
    VALUES ?iata { ${values} }
    ?airport wdt:P238 ?iata; p:P3872 ?statement.
    ?statement ps:P3872 ?passengers; pqv:P585 ?dateValue.
    ?dateValue wikibase:timeValue ?date; wikibase:timePrecision ?precision.
    FILTER(?passengers > 0)
  }`;
  const url = new URL(endpoint);
  url.searchParams.set('query', query);
  url.searchParams.set('format', 'json');
  const response = await fetch(url, { headers: { 'User-Agent': 'AirportTowerIndex/1.0 (https://danielalmazan.com/airport-to-tower/)' } });
  if (!response.ok) {
    if (attempt < 4 && (response.status === 429 || response.status >= 500)) {
      await sleep(attempt * 2500);
      return queryBatch(iatas, attempt + 1);
    }
    throw new Error(`Wikidata query failed (${response.status})`);
  }
  const payload = await response.json() as { results: { bindings: Binding[] } };
  return payload.results.bindings;
}

async function main() {
  const parsed = Papa.parse<AirportRow>(await readFile(airportsUrl, 'utf8'), { header: true, skipEmptyLines: true });
  if (parsed.errors.length) throw new Error('Unable to parse airports.csv');
  const iatas = [...new Set(parsed.data.filter((airport) => airport.iata && !airport.annual_passengers_m).map((airport) => airport.iata))].sort();
  const bindings: Binding[] = [];
  for (let index = 0; index < iatas.length; index += 35) {
    const batch = iatas.slice(index, index + 35);
    bindings.push(...await queryBatch(batch));
    await sleep(400);
  }

  const latest = new Map<string, { iata: string; annual_passengers: number; passenger_year: number; source_id: string; wikidata_id: string }>();
  for (const binding of bindings) {
    if (Number(binding.precision.value) !== 9) continue;
    const iata = binding.iata.value;
    const annualPassengers = Number(binding.passengers.value);
    const passengerYear = Number(binding.date.value.slice(0, 4));
    const wikidataId = binding.airport.value.split('/').pop() ?? '';
    if (!Number.isFinite(annualPassengers) || annualPassengers <= 0 || !Number.isInteger(passengerYear)) continue;
    const current = latest.get(iata);
    if (!current || passengerYear > current.passenger_year || (passengerYear === current.passenger_year && annualPassengers > current.annual_passengers)) {
      latest.set(iata, { iata, annual_passengers: annualPassengers, passenger_year: passengerYear, source_id: sourceId, wikidata_id: wikidataId });
    }
  }
  const rows = [...latest.values()].sort((a, b) => a.iata.localeCompare(b.iata));
  await writeFile(outputUrl, `${Papa.unparse(rows, { newline: '\n' })}\n`, 'utf8');
  console.log(`Saved latest annual Wikidata passenger totals for ${rows.length} of ${iatas.length} missing-IATA airports.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
