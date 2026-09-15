import { loadData } from './load-data.js';
import { geodesicDistanceMetres } from '../src/lib/math.js';

const errors: string[] = [];
const warnings: string[] = [];
const fail = (message: string) => errors.push(message);
const warn = (message: string) => warnings.push(message);
const unique = <T>(items: T[], key: (item: T) => string, label: string) => {
  const seen = new Set<string>();
  items.forEach((item) => { const id = key(item); if (seen.has(id)) fail(`Duplicate ${label}: ${id}`); seen.add(id); });
};

async function main() {
  const { cities, airports, cityAirports, towers, cityTowers, selections, sources } = await loadData();
  unique(cities, (item) => item.city_id, 'city ID');
  unique(airports, (item) => item.airport_id, 'airport ID');
  unique(towers, (item) => item.tower_id, 'tower ID');
  unique(sources, (item) => item.source_id, 'source ID');
  unique(cityAirports, (item) => `${item.city_id}/${item.airport_id}`, 'city-airport relation');
  unique(cityTowers, (item) => `${item.city_id}/${item.tower_id}`, 'city-tower relation');
  unique(selections, (item) => `${item.city_id}/${item.mode}/${item.tower_id}`, 'tower selection');

  const cityIds = new Set(cities.map((item) => item.city_id));
  const airportIds = new Set(airports.map((item) => item.airport_id));
  const towerIds = new Set(towers.map((item) => item.tower_id));
  const sourceIds = new Set(sources.map((item) => item.source_id));
  const requireSource = (id: string, context: string) => { if (!sourceIds.has(id)) fail(`Missing source ${id} referenced by ${context}`); };

  if (cities.length !== 150) fail(`Edition must contain 150 cities; found ${cities.length}`);
  cities.forEach((city) => {
    if (!city.city_name_en || !city.city_name_es || !city.country_name_en || !city.country_name_es) fail(`Missing bilingual label for ${city.city_id}`);
    if (city.review_status !== 'approved') fail(`City is not approved: ${city.city_id}`);
    requireSource(city.population_source_id, city.city_id);
    const links = cityAirports.filter((item) => item.city_id === city.city_id && item.include);
    if (!links.length) fail(`No included airport for ${city.city_id}`);
    if (links.filter((item) => item.primary_airport).length !== 1) fail(`Expected exactly one primary airport for ${city.city_id}`);
    const citySelections = selections.filter((item) => item.city_id === city.city_id);
    if (citySelections.filter((item) => item.mode === 'iconic').length !== 1) fail(`Expected exactly one iconic selection for ${city.city_id}`);
    if (!citySelections.some((item) => item.mode === 'tallest')) fail(`No tallest selection for ${city.city_id}`);
  });

  const codeOwners = new Map<string, string>();
  airports.forEach((airport) => {
    if (!Number.isFinite(airport.latitude) || airport.latitude < -90 || airport.latitude > 90) fail(`Invalid latitude for ${airport.airport_id}`);
    if (!Number.isFinite(airport.longitude) || airport.longitude < -180 || airport.longitude > 180) fail(`Invalid longitude for ${airport.airport_id}`);
    if (airport.iata && !/^[A-Z]{3}$/.test(airport.iata)) fail(`Invalid IATA code for ${airport.airport_id}`);
    if (airport.icao && !/^[A-Z0-9]{3,4}$/.test(airport.icao)) fail(`Invalid ICAO code for ${airport.airport_id}`);
    if (airport.iata && codeOwners.has(airport.iata) && codeOwners.get(airport.iata) !== airport.airport_id) fail(`Duplicate IATA code ${airport.iata}`);
    if (airport.iata) codeOwners.set(airport.iata, airport.airport_id);
    requireSource(airport.coordinate_source_id, airport.airport_id);
  });
  towers.forEach((tower) => {
    if (!Number.isFinite(tower.latitude) || tower.latitude < -90 || tower.latitude > 90) fail(`Invalid latitude for ${tower.tower_id}`);
    if (!Number.isFinite(tower.longitude) || tower.longitude < -180 || tower.longitude > 180) fail(`Invalid longitude for ${tower.tower_id}`);
    if (!Number.isFinite(tower.height_m) || tower.height_m <= 0) fail(`Invalid height for ${tower.tower_id}`);
    requireSource(tower.coordinate_source_id, tower.tower_id);
    requireSource(tower.height_source_id, tower.tower_id);
  });
  cityAirports.forEach((relation) => {
    if (!cityIds.has(relation.city_id)) fail(`Unknown city in airport relation: ${relation.city_id}`);
    if (!airportIds.has(relation.airport_id)) fail(`Unknown airport in relation: ${relation.airport_id}`);
    if (relation.review_status !== 'approved') fail(`Unapproved city-airport relation: ${relation.city_id}/${relation.airport_id}`);
    requireSource(relation.association_source_id, `${relation.city_id}/${relation.airport_id}`);
    requireSource(relation.service_source_id, `${relation.city_id}/${relation.airport_id}`);
  });
  selections.forEach((selection) => {
    if (!cityIds.has(selection.city_id)) fail(`Unknown city in selection: ${selection.city_id}`);
    if (!towerIds.has(selection.tower_id)) fail(`Unknown tower in selection: ${selection.tower_id}`);
    if (!selection.selection_reason_en || !selection.selection_reason_es) fail(`Missing bilingual rationale: ${selection.city_id}/${selection.mode}`);
    requireSource(selection.selection_source_id, `${selection.city_id}/${selection.mode}`);
  });

  for (const relation of cityAirports.filter((item) => item.include)) {
    const airport = airports.find((item) => item.airport_id === relation.airport_id)!;
    for (const selection of selections.filter((item) => item.city_id === relation.city_id)) {
      const tower = towers.find((item) => item.tower_id === selection.tower_id)!;
      try {
        const distance = geodesicDistanceMetres(airport.latitude, airport.longitude, tower.latitude, tower.longitude);
        if (distance > 200_000) warn(`Distance over 200 km: ${relation.city_id}/${airport.iata}/${selection.mode} (${Math.round(distance / 1000)} km)`);
      } catch (error) { fail(`${relation.city_id}/${airport.iata}/${selection.mode}: ${String(error)}`); }
    }
  }

  warnings.forEach((message) => console.warn(`WARN: ${message}`));
  if (errors.length) throw new Error(`Data validation failed:\n- ${errors.join('\n- ')}`);
  console.log(`Validated ${cities.length} cities, ${airports.length} airports, ${towers.length} towers and ${selections.length} selections (${warnings.length} warnings).`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
