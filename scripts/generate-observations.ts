import { mkdir, writeFile } from 'node:fs/promises';
import Papa from 'papaparse';
import { loadData } from './load-data.js';
import { geodesicDistanceMetres } from '../src/lib/math.js';
import type { Metadata, Observation } from '../src/types.js';

const output = new URL('../data/generated/', import.meta.url);
const publicOutput = new URL('../public/data/', import.meta.url);

async function main() {
  const { cities, airports, cityAirports, towers, selections } = await loadData();
  const cityById = new Map(cities.map((item) => [item.city_id, item]));
  const airportById = new Map(airports.map((item) => [item.airport_id, item]));
  const towerById = new Map(towers.map((item) => [item.tower_id, item]));
  const selectionsByCity = new Map<string, typeof selections>();
  selections.forEach((item) => selectionsByCity.set(item.city_id, [...(selectionsByCity.get(item.city_id) ?? []), item]));
  const observations: Observation[] = [];

  for (const relation of cityAirports.filter((item) => item.include)) {
    const city = cityById.get(relation.city_id);
    const airport = airportById.get(relation.airport_id);
    if (!city || !airport) continue;
    for (const selection of selectionsByCity.get(city.city_id) ?? []) {
      const tower = towerById.get(selection.tower_id);
      if (!tower) continue;
      const distanceM = geodesicDistanceMetres(airport.latitude, airport.longitude, tower.latitude, tower.longitude);
      observations.push({
        observation_id: `${city.city_id}--${airport.airport_id}--${selection.mode}--${tower.tower_id}`,
        city_id: city.city_id,
        city_name_en: city.city_name_en,
        city_name_es: city.city_name_es,
        city_name_local: city.city_name_local,
        country_code: city.country_code,
        country_name_en: city.country_name_en,
        country_name_es: city.country_name_es,
        continent: city.continent,
        region: city.region,
        airport_id: airport.airport_id,
        airport_name: airport.airport_name,
        airport_name_es: airport.airport_name_es,
        iata: airport.iata,
        icao: airport.icao,
        airport_latitude: airport.latitude,
        airport_longitude: airport.longitude,
        airport_type: airport.airport_type,
        annual_passengers_m: airport.annual_passengers_m,
        passenger_year: airport.passenger_year,
        primary_airport: relation.primary_airport,
        service_pattern: relation.service_pattern,
        tower_id: tower.tower_id,
        tower_name: tower.tower_name,
        tower_name_es: tower.tower_name_es,
        tower_latitude: tower.latitude,
        tower_longitude: tower.longitude,
        height_m: tower.height_m,
        height_basis: tower.height_basis,
        tower_type: tower.tower_type,
        completed_year: tower.completed_year,
        mode: selection.mode,
        co_tallest: selection.co_tallest,
        confidence: selection.confidence,
        selection_reason_en: selection.selection_reason_en,
        selection_reason_es: selection.selection_reason_es,
        distance_m: distanceM,
        distance_km: distanceM / 1000,
        source_ids: [...new Set([airport.coordinate_source_id, airport.passenger_source_id, relation.association_source_id, relation.service_source_id, tower.coordinate_source_id, tower.height_source_id, selection.selection_source_id].filter(Boolean))],
        reviewed_at: selection.reviewed_at,
      });
    }
  }
  observations.sort((a, b) => a.mode.localeCompare(b.mode) || a.distance_m - b.distance_m || a.observation_id.localeCompare(b.observation_id));

  const metadata: Metadata = {
    release_id: '2026-top-research-1',
    release_status: 'research_preview',
    generated_at: '2026-09-16T00:00:00Z',
    review_cutoff: '2026-09-16',
    methodology_version: '1.0.0',
    city_count: cities.length,
    airport_count: new Set(cityAirports.filter((item) => item.include).map((item) => item.airport_id)).size,
    tower_count: new Set(selections.map((item) => item.tower_id)).size,
    observation_count: observations.length,
    mode_counts: {
      tallest: observations.filter((item) => item.mode === 'tallest').length,
      iconic: observations.filter((item) => item.mode === 'iconic').length,
    },
    low_confidence_selection_count: selections.filter((item) => item.confidence === 'low').length,
    candidate_selection_count: selections.length,
    source_snapshot: 'OurAirports 2026-09-14; Wikidata entities and official 2025 airport-demand sources accessed 2026-09-16',
  };

  const sourceIds = new Set(observations.flatMap((item) => item.source_ids));
  const sources = (await loadData()).sources.filter((source) => sourceIds.has(source.source_id));
  const csvRows = observations.map((observation) => ({ ...observation, source_ids: observation.source_ids.join(';') }));
  await Promise.all([mkdir(output, { recursive: true }), mkdir(publicOutput, { recursive: true })]);
  const files = [
    ['observations.json', `${JSON.stringify(observations, null, 2)}\n`],
    ['observations.csv', `${Papa.unparse(csvRows, { newline: '\n' })}\n`],
    ['metadata.json', `${JSON.stringify(metadata, null, 2)}\n`],
    ['sources.json', `${JSON.stringify(sources, null, 2)}\n`],
  ] as const;
  await Promise.all(files.flatMap(([name, contents]) => [writeFile(new URL(name, output), contents), writeFile(new URL(name, publicOutput), contents)]));
  console.log(`Generated ${observations.length} observations from ${cities.length} cities.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
