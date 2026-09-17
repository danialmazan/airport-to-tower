import { writeFile, readFile } from 'node:fs/promises';
import Papa from 'papaparse';

type TowerRow = Record<string, string> & { tower_id: string; tower_name: string; height_m: string };
type Binding = { item: { value: string }; amount: { value: string }; normalized: { value: string }; unit: { value: string } };

const towersUrl = new URL('../data/curated/towers.csv', import.meta.url);
const auditUrl = new URL('../data/snapshots/wikidata-height-audit-2026-09-16.csv', import.meta.url);
const endpoint = 'https://query.wikidata.org/sparql';

async function query(ids: string[]): Promise<Binding[]> {
  const sparql = `SELECT ?item ?amount ?unit ?normalized WHERE {
    VALUES ?item { ${ids.map((id) => `wd:${id}`).join(' ')} }
    ?item p:P2048 ?statement.
    ?statement psv:P2048 ?valueNode.
    ?valueNode wikibase:quantityAmount ?amount; wikibase:quantityUnit ?unit.
    ?statement <http://www.wikidata.org/prop/statement/value-normalized/P2048> ?normalizedNode.
    ?normalizedNode wikibase:quantityAmount ?normalized.
  }`;
  const url = `${endpoint}?format=json&query=${encodeURIComponent(sparql)}`;
  const response = await fetch(url, { headers: { 'User-Agent': 'airport-to-tower-index/1.0 (data audit)' } });
  if (!response.ok) throw new Error(`Wikidata query failed: ${response.status}`);
  return (await response.json()).results.bindings;
}

async function main() {
  const text = await readFile(towersUrl, 'utf8');
  const parsed = Papa.parse<TowerRow>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) throw new Error(parsed.errors[0].message);
  const qids = parsed.data.map((row) => row.tower_id.match(/^wikidata-(q\d+)$/i)?.[1]?.toUpperCase()).filter((value): value is string => Boolean(value));
  const bindings: Binding[] = [];
  for (let index = 0; index < qids.length; index += 40) bindings.push(...await query(qids.slice(index, index + 40)));
  const claims = new Map<string, Binding[]>();
  for (const binding of bindings) {
    const qid = binding.item.value.split('/').pop()!;
    claims.set(qid, [...(claims.get(qid) ?? []), binding]);
  }
  const audit: Record<string, string | number>[] = [];
  let corrected = 0;
  for (const tower of parsed.data) {
    const qid = tower.tower_id.match(/^wikidata-(q\d+)$/i)?.[1]?.toUpperCase();
    if (!qid) continue;
    const current = Number(tower.height_m);
    const match = (claims.get(qid) ?? []).find((claim) => Math.abs(Number(claim.amount.value) - current) < 0.000001);
    if (!match) {
      audit.push({ tower_id: tower.tower_id, tower_name: tower.tower_name, stored_height_m: current, normalized_height_m: '', source_unit: '', action: 'review_no_matching_claim' });
      continue;
    }
    const normalized = Number(match.normalized.value);
    const changed = Math.abs(normalized - current) > 0.000001;
    if (changed) { tower.height_m = String(normalized); corrected += 1; }
    audit.push({ tower_id: tower.tower_id, tower_name: tower.tower_name, stored_height_m: current, normalized_height_m: normalized, source_unit: match.unit.value.split('/').pop()!, action: changed ? 'corrected_to_metres' : 'verified_metres' });
  }
  await Promise.all([
    writeFile(towersUrl, `${Papa.unparse(parsed.data, { newline: '\n' })}\n`),
    writeFile(auditUrl, `${Papa.unparse(audit, { newline: '\n' })}\n`),
  ]);
  console.log(`Audited ${audit.length} Wikidata tower heights and corrected ${corrected} unit errors.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
