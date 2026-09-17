import { writeFile } from 'node:fs/promises';
import { loadData } from './load-data.js';

type WikiEntity = { sitelinks?: Record<string, { title: string; url: string }> };

const clean = (value: string) => value
  .replace(/<!--.*?-->/gs, ' ')
  .replace(/<ref\b[^>]*>.*?<\/ref>/gis, ' ')
  .replace(/<ref\b[^>]*\/?\s*>/gis, ' ')
  .replace(/\{\{convert\|([^}|]+)\|(?:m|metre|meter)s?\b[^}]*\}\}/gi, '$1 m')
  .replace(/\[\[[^|\]]+\|([^\]]+)\]\]/g, '$1')
  .replace(/\[\[([^\]]+)\]\]/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

const heightPatterns = [
  /\|\s*(?:height|spire_height|antenna_spire|roof)\s*=\s*([^\n|]+)/i,
  /(?:height|stands?|rises?|tower|spire)[^.]{0,80}?(\d+(?:[.,]\d+)?)\s*(?:m|metres?|meters?)\b/i,
  /(\d+(?:[.,]\d+)?)\s*(?:m|metres?|meters?)[^.]{0,80}?(?:high|tall|height)/i,
];

async function getJson(url: string) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'AirportTowerIndex/1.0 research snapshot' },
    signal: AbortSignal.timeout(3_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function main() {
  const { cities, towers, selections } = await loadData();
  const citiesById = new Map(cities.map((city) => [city.city_id, city]));
  const towersById = new Map(towers.map((tower) => [tower.tower_id, tower]));
  const targets = selections.filter((selection, index, all) => {
    const tower = towersById.get(selection.tower_id)!;
    return tower.height_m === 50
      && selection.selection_source_id.startsWith('wikidata-')
      && all.findIndex((item) => item.tower_id === selection.tower_id) === index;
  });

  const rows: string[][] = [['city_id', 'city_name', 'tower_id', 'tower_name', 'candidate_height_m', 'source_url', 'evidence', 'status']];
  console.log(`Researching ${targets.length} generic-height landmarks...`);
  for (const selection of targets) {
    const city = citiesById.get(selection.city_id)!;
    const tower = towersById.get(selection.tower_id)!;
    const qid = selection.tower_id.replace(/^wikidata-/i, '').toUpperCase();
    let sourceUrl = `https://www.wikidata.org/wiki/${qid}`;
    let evidence = '';
    let candidateHeight = '';
    let status = 'no_page_or_height';
    try {
      const entityPayload = await getJson(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`) as { entities: Record<string, WikiEntity> };
      const entity = entityPayload.entities[qid];
      const link = entity?.sitelinks?.enwiki ?? entity?.sitelinks?.eswiki;
      if (link) {
        const language = entity.sitelinks?.enwiki ? 'en' : 'es';
        sourceUrl = link.url;
        const api = `https://${language}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(link.title)}&prop=wikitext&format=json&origin=*`;
        const parsed = await getJson(api) as { parse?: { wikitext?: { '*': string } } };
        const text = parsed.parse?.wikitext?.['*'] ?? '';
        for (const pattern of heightPatterns) {
          const match = text.match(pattern);
          if (!match) continue;
          const rawEvidence = clean(match[0]);
          const numeric = rawEvidence.match(/(\d+(?:[.,]\d+)?)\s*(?:m|metres?|meters?)\b/i);
          if (!numeric) continue;
          candidateHeight = numeric[1].replace(',', '.');
          evidence = rawEvidence.slice(0, 240);
          status = 'candidate_found';
          break;
        }
      }
    } catch (error) {
      status = `fetch_error: ${String(error).replaceAll(',', ';')}`;
    }
    rows.push([city.city_id, city.city_name_en, tower.tower_id, tower.tower_name, candidateHeight, sourceUrl, evidence, status]);
    console.log(`${rows.length - 1}/${targets.length} ${city.city_name_en}: ${candidateHeight || status}`);
  }

  const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n') + '\n';
  const destination = new URL('../data/snapshots/generic-height-research-2026-09-16.csv', import.meta.url);
  await writeFile(destination, csv, 'utf8');
  console.log(`Wrote ${rows.length - 1} research rows to ${destination.pathname}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
