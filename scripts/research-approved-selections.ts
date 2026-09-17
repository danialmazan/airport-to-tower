import { writeFile } from 'node:fs/promises';
import Papa from 'papaparse';

const targets = [
  ['Manila', 'tallest', 'Metrobank Center Grand Hyatt Manila'], ['Manila', 'iconic', 'Rizal Monument Manila'],
  ['Ahmedabad', 'tallest', 'Mondeal One Ahmedabad'], ['Ahmedabad', 'iconic', 'Patang Hotel Ahmedabad'],
  ['Glasgow', 'tallest', 'Glasgow Tower'], ['Glasgow', 'iconic', 'University of Glasgow tower'],
  ['Algiers', 'tallest', 'Great Mosque of Algiers'], ['Algiers', 'iconic', 'Martyrs Memorial Algiers'],
  ['Windhoek', 'tallest', 'Sanlam Centre Windhoek'], ['Windhoek', 'iconic', 'Christ Church Windhoek'],
  ['Antananarivo', 'tallest', 'FIARO Antananarivo'], ['Antananarivo', 'iconic', 'Rova of Antananarivo'],
  ['Belo Horizonte', 'tallest', 'Edificio Aureliano Chaves'], ['Belo Horizonte', 'iconic', 'Edificio Acaiaca'],
  ['Perth', 'tallest', 'Central Park Perth building'], ['Perth', 'iconic', 'The Bell Tower Perth'],
  ['Adelaide', 'tallest', 'Frome Central Tower One'], ['Adelaide', 'iconic', "St Peter's Cathedral Adelaide"],
  ['Auckland', 'tallest', 'Sky Tower Auckland'], ['Auckland', 'iconic', 'Sky Tower Auckland'],
  ['Puerto del Rosario', 'tallest', 'Puerto del Rosario Lighthouse'], ['Puerto del Rosario', 'iconic', 'Church of Our Lady of the Rosary Puerto del Rosario'],
  ['Santa Cruz de La Palma', 'tallest', 'Church of El Salvador Santa Cruz de La Palma'], ['Santa Cruz de La Palma', 'iconic', 'Church of El Salvador Santa Cruz de La Palma'],
  ['Orlando', 'tallest', '200 South Orange Orlando'], ['Orlando', 'iconic', 'Cinderella Castle Walt Disney World'],
  ['Dhaka', 'iconic', 'Shaheed Minar Dhaka'], ['Beijing', 'iconic', 'Temple of Heaven'],
  ['Chongqing', 'iconic', "People's Liberation Monument Chongqing"], ['Kolkata', 'iconic', 'Victoria Memorial Kolkata'],
  ['Jakarta', 'iconic', 'National Monument Indonesia'], ['Hong Kong', 'iconic', 'Bank of China Tower Hong Kong'],
  ['Vienna', 'iconic', "St. Stephen's Cathedral Vienna"], ['Hamburg', 'iconic', "St. Michael's Church Hamburg"],
  ['Birmingham', 'iconic', 'Joseph Chamberlain Memorial Clock Tower'], ['Tirana', 'iconic', 'Clock Tower of Tirana'],
  ['Lagos', 'iconic', 'NECOM House'], ['Alexandria', 'iconic', 'Montaza Palace'],
  ['Abidjan', 'iconic', 'La Pyramide Abidjan'], ['Accra', 'iconic', 'Black Star Gate Accra'],
  ['Tunis', 'iconic', 'Clock Tower Tunis'], ['Harare', 'iconic', 'Reserve Bank of Zimbabwe tower'],
  ['Houston', 'iconic', 'Williams Tower Houston'], ['Miami', 'iconic', 'Freedom Tower Miami'],
  ['Boston', 'iconic', 'Custom House Tower Boston'], ['Bogotá', 'iconic', 'Colpatria Tower'],
  ['Guayaquil', 'iconic', 'Torre Morisca Guayaquil'], ['Melbourne', 'iconic', 'Arts Centre Melbourne spire'],
  ['Suva', 'iconic', 'Government Buildings Suva'], ['Valencia', 'iconic', 'Micalet Valencia'],
  ['Alicante', 'iconic', 'Santa Barbara Castle Alicante'], ['Las Vegas', 'iconic', 'Stratosphere Tower Las Vegas'],
  ['Phoenix', 'iconic', 'Westward Ho Phoenix'],
] as const;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, { headers: { 'user-agent': 'AirportTowerIndex/1.0 selection research' } });
    if (response.ok) return response.json();
    if (response.status === 429 || response.status >= 500) { await sleep(750 * 2 ** attempt); continue; }
    throw new Error(`${response.status} ${url}`);
  }
  throw new Error(`Failed: ${url}`);
}

const rows: Record<string, string | number>[] = [];
const uniqueTerms = [...new Set(targets.map(([, , query]) => query))];
for (let index = 0; index < uniqueTerms.length; index += 3) {
  const batch = uniqueTerms.slice(index, index + 3);
  const values = batch.map((term) => JSON.stringify(term)).join(' ');
  const sparql = `SELECT ?term ?item ?itemLabel ?itemDescription ?rank WHERE {
    VALUES ?term { ${values} }
    SERVICE wikibase:mwapi {
      bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "EntitySearch"; mwapi:search ?term; mwapi:language "en".
      ?item wikibase:apiOutputItem mwapi:item. ?rank wikibase:apiOrdinal true.
    }
    FILTER(?rank <= 5)
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } ORDER BY ?term ?rank`;
  try {
    const body = await getJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`) as {
      results?: { bindings?: Array<Record<string, { value: string }>> };
    };
    for (const result of body.results?.bindings ?? []) {
      const query = result.term.value;
      for (const [city, mode, targetQuery] of targets.filter((target) => target[2] === query)) {
        rows.push({ city, mode, query, rank: Number(result.rank.value), qid: result.item.value.split('/').pop() ?? '', label: result.itemLabel.value, description: result.itemDescription?.value ?? '', url: result.item.value });
      }
    }
  } catch (error) {
    for (const query of batch) for (const [city, mode, targetQuery] of targets.filter((target) => target[2] === query)) {
      rows.push({ city, mode, query, rank: 0, qid: '', label: '', description: String(error), url: '' });
    }
  }
  await sleep(250);
}

const output = Papa.unparse(rows, { newline: '\n' }) + '\n';
await writeFile(new URL('../data/snapshots/approved-selection-candidates-2026-09-16.csv', import.meta.url), output, 'utf8');
console.log(`Wrote ${rows.length} candidate rows for ${targets.length} approved selections.`);
