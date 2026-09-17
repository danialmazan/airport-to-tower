import { writeFile } from 'node:fs/promises';
import Papa from 'papaparse';

const records = [
  ['Manila','tallest','en','Metrobank Center'], ['Manila','iconic','en','Rizal Monument'],
  ['Ahmedabad','tallest','en','Mondeal One'], ['Ahmedabad','iconic','en','Patang Hotel'],
  ['Glasgow','tallest','en','Glasgow Tower'], ['Glasgow','iconic','en','Gilbert Scott Building'],
  ['Algiers','tallest','en','Djamaa el Djazaïr'], ["Algiers",'iconic','en',"Martyrs' Memorial, Algiers"],
  ['Windhoek','tallest','en','Sanlam Centre'], ['Windhoek','iconic','en','Christ Church, Windhoek'],
  ['Antananarivo','tallest','en','FIARO Building'], ['Antananarivo','iconic','en','Rova of Antananarivo'],
  ['Belo Horizonte','tallest','en','Aureliano Chaves building'], ['Belo Horizonte','iconic','en','Edifício Acaiaca'],
  ['Perth','tallest','en','Central Park (skyscraper)'], ['Perth','iconic','en','The Bell Tower (Perth)'],
  ['Adelaide','tallest','en','The Adelaidean'], ['Adelaide','iconic','en',"St Peter's Cathedral, Adelaide"],
  ['Auckland','tallest','en','Sky Tower (Auckland)'], ['Auckland','iconic','en','Sky Tower (Auckland)'],
  ['Puerto del Rosario','tallest','en','Puerto del Rosario Lighthouse'], ['Puerto del Rosario','iconic','es','Iglesia de Nuestra Señora del Rosario (Puerto del Rosario)'],
  ['Santa Cruz de La Palma','tallest','es','Iglesia matriz de El Salvador (Santa Cruz de La Palma)'], ['Santa Cruz de La Palma','iconic','es','Iglesia matriz de El Salvador (Santa Cruz de La Palma)'],
  ['Orlando','tallest','en','200 South Orange'], ['Orlando','iconic','en','Cinderella Castle'],
  ['Dhaka','iconic','en','Central Shaheed Minar'], ['Beijing','iconic','en','Temple of Heaven'],
  ['Chongqing','iconic','en',"People's Liberation Monument (Chongqing)"], ['Kolkata','iconic','en','Victoria Memorial, Kolkata'],
  ['Jakarta','iconic','en','National Monument (Indonesia)'], ['Hong Kong','iconic','en','Bank of China Tower (Hong Kong)'],
  ['Vienna','iconic','en',"St. Stephen's Cathedral, Vienna"], ['Hamburg','iconic','en',"St. Michael's Church, Hamburg"],
  ['Birmingham','iconic','en','Joseph Chamberlain Memorial Clock Tower'], ['Tirana','iconic','en','Clock Tower of Tirana'],
  ['Lagos','iconic','en','NECOM House'], ['Alexandria','iconic','en','Montaza Palace'],
  ['Abidjan','iconic','en','La Pyramide, Abidjan'], ['Accra','iconic','en','Black Star Gate'],
  ['Tunis','iconic','en','Clock Tower, Tunis'], ['Harare','iconic','en','Reserve Bank of Zimbabwe'],
  ['Houston','iconic','en','Williams Tower'], ['Miami','iconic','en','Freedom Tower (Miami)'],
  ['Boston','iconic','en','Custom House Tower'], ['Bogotá','iconic','en','Torre Colpatria'],
  ['Guayaquil','iconic','es','Torre Morisca'], ['Melbourne','iconic','en','Arts Centre Melbourne'],
  ['Suva','iconic','en','Government Buildings, Suva'], ['Valencia','iconic','ca','Micalet'],
  ['Alicante','iconic','en','Santa Bárbara Castle'], ['Las Vegas','iconic','en','The Strat'],
  ['Phoenix','iconic','en','Westward Ho (Phoenix)'],
] as const;

async function json(url: string) {
  const response = await fetch(url, { headers: { 'user-agent': 'AirportTowerIndex/1.0 research' } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

type Resolved = { city: string; mode: string; language: string; title: string; qid: string; pageTitle: string; latitude: string; longitude: string };
const resolved: Resolved[] = [];
for (const language of ['en','es','ca']) {
  const languageRows = records.filter((row) => row[2] === language);
  for (let index = 0; index < languageRows.length; index += 25) {
    const batch = languageRows.slice(index, index + 25);
    const titles = batch.map((row) => row[3]).join('|');
    const url = `https://${language}.wikipedia.org/w/api.php?action=query&prop=pageprops|coordinates&ppprop=wikibase_item&redirects=1&format=json&origin=*&titles=${encodeURIComponent(titles)}`;
    const body = await json(url) as { query?: { pages?: Record<string, { title: string; pageprops?: { wikibase_item?: string }; coordinates?: Array<{ lat: number; lon: number }> }> } };
    const pages = Object.values(body.query?.pages ?? {});
    for (const row of batch) {
      const normalized = row[3].replaceAll('_',' ').toLowerCase();
      const page = pages.find((candidate) => candidate.title.replaceAll('_',' ').toLowerCase() === normalized)
        ?? pages.find((candidate) => candidate.title.toLowerCase().includes(normalized.split(' (')[0]));
      const coord = page?.coordinates?.[0];
      resolved.push({ city: row[0], mode: row[1], language, title: row[3], qid: page?.pageprops?.wikibase_item ?? '', pageTitle: page?.title ?? '', latitude: coord ? String(coord.lat) : '', longitude: coord ? String(coord.lon) : '' });
    }
  }
}

const qids = [...new Set(resolved.map((row) => row.qid).filter(Boolean))];
const entities = new Map<string, any>();
for (let index = 0; index < qids.length; index += 40) {
  const batch = qids.slice(index, index + 40);
  const body = await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.join('|')}&props=claims|labels&languages=en|es|ca&format=json&origin=*`) as { entities?: Record<string, any> };
  Object.entries(body.entities ?? {}).forEach(([qid, entity]) => entities.set(qid, entity));
}

const getAmount = (entity: any, property: string) => {
  const claim = entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
  return typeof claim?.amount === 'string' ? Number(claim.amount) : '';
};
const getYear = (entity: any) => {
  const value = entity?.claims?.P1619?.[0]?.mainsnak?.datavalue?.value?.time ?? entity?.claims?.P571?.[0]?.mainsnak?.datavalue?.value?.time;
  return typeof value === 'string' ? Number(value.slice(1,5)) : '';
};
const getCoord = (entity: any) => entity?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;

const output = resolved.map((row) => {
  const entity = entities.get(row.qid);
  const coord = getCoord(entity);
  return { ...row, label: entity?.labels?.en?.value ?? entity?.labels?.es?.value ?? row.pageTitle, height_m: getAmount(entity,'P2048'), completed_year: getYear(entity), latitude: row.latitude || coord?.latitude || '', longitude: row.longitude || coord?.longitude || '' };
});
await writeFile(new URL('../data/snapshots/approved-landmarks-resolved-2026-09-16.csv', import.meta.url), Papa.unparse(output, { newline: '\n' }) + '\n');
console.log(`Resolved ${output.filter((row) => row.qid).length}/${output.length} approved selections.`);
