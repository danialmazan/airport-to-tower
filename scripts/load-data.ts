import { readCsv } from './csv.js';
import type { Airport, City, CityAirport, CityTower, SourceRecord, Tower, TowerSelection } from '../src/types.js';

const curated = new URL('../data/curated/', import.meta.url);

export async function loadData() {
  const [cities, airports, cityAirports, towers, cityTowers, selections, sources] = await Promise.all([
    readCsv<City>(new URL('cities.csv', curated)),
    readCsv<Airport>(new URL('airports.csv', curated)),
    readCsv<CityAirport>(new URL('city_airports.csv', curated)),
    readCsv<Tower>(new URL('towers.csv', curated)),
    readCsv<CityTower>(new URL('city_towers.csv', curated)),
    readCsv<TowerSelection>(new URL('tower_selections.csv', curated)),
    readCsv<SourceRecord>(new URL('sources.csv', curated)),
  ]);
  return { cities, airports, cityAirports, towers, cityTowers, selections, sources };
}
