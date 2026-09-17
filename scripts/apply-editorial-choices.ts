import { readFile, writeFile } from 'node:fs/promises';
import Papa from 'papaparse';

type Row = Record<string, string>;
type Choice = {
  city: string;
  mode: 'tallest' | 'iconic';
  id: string;
  name: string;
  nameEs?: string;
  lat: number;
  lon: number;
  height: number;
  year: number;
  type: string;
  sourceUrl: string;
  sourceTitle?: string;
  confidence?: 'high' | 'medium';
};

const root = new URL('../data/curated/', import.meta.url);
const reviewedAt = '2026-09-16';

const choices: Choice[] = [
  { city: 'Manila', mode: 'tallest', id: 'wikidata-q5440278', name: 'Grand Hyatt Manila', lat: 14.55696, lon: 121.05206, height: 318, year: 2018, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q5440278' },
  { city: 'Manila', mode: 'iconic', id: 'wikidata-q7339077', name: 'Rizal Monument', lat: 14.581669, lon: 120.976694, height: 14, year: 1908, type: 'monument', sourceUrl: 'https://www.wikidata.org/wiki/Q7339077' },
  { city: 'Ahmedabad', mode: 'tallest', id: 'curated-mondeal-one', name: 'Mondeal One', lat: 23.03972, lon: 72.51042, height: 148, year: 2015, type: 'building', sourceUrl: 'https://www.skyscrapercenter.com/building/mondeal-one/17099', sourceTitle: 'Mondeal One building profile' },
  { city: 'Ahmedabad', mode: 'iconic', id: 'wikidata-q107210904', name: 'Patang', nameEs: 'Patang', lat: 23.02638888888889, lon: 72.57216666666666, height: 67, year: 1984, type: 'observation_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q107210904' },
  { city: 'Glasgow', mode: 'tallest', id: 'wikidata-q3533344', name: 'Glasgow Tower', lat: 55.8585, lon: -4.29325, height: 127, year: 2001, type: 'observation_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q3533344' },
  { city: 'Glasgow', mode: 'iconic', id: 'wikidata-q17567981', name: 'University of Glasgow tower', nameEs: 'Torre de la Universidad de Glasgow', lat: 55.8718, lon: -4.28897, height: 85, year: 1870, type: 'university_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q17567981' },
  { city: 'Algiers', mode: 'tallest', id: 'wikidata-q23012984', name: 'Great Mosque of Algiers minaret', nameEs: 'Minarete de la Gran Mezquita de Argel', lat: 36.735833333333, lon: 3.1380555555556, height: 265, year: 2019, type: 'minaret', sourceUrl: 'https://www.wikidata.org/wiki/Q23012984' },
  { city: 'Algiers', mode: 'iconic', id: 'wikidata-q3056085', name: "Martyrs' Memorial", nameEs: 'Monumento de los Mártires', lat: 36.74565, lon: 3.0697, height: 92, year: 1982, type: 'monument', sourceUrl: 'https://www.wikidata.org/wiki/Q3056085' },
  { city: 'Windhoek', mode: 'tallest', id: 'wikidata-q1664331', name: 'Sanlam Centre', lat: -22.558904, lon: 17.082481, height: 50.24, year: 1990, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q1664331' },
  { city: 'Windhoek', mode: 'iconic', id: 'wikidata-q1087458', name: 'Christ Church', nameEs: 'Iglesia de Cristo', lat: -22.56777778, lon: 17.08722222, height: 42, year: 1910, type: 'church_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q1087458' },
  { city: 'Antananarivo', mode: 'tallest', id: 'curated-fiaro-building', name: 'FIARO Building', nameEs: 'Edificio FIARO', lat: -18.91042, lon: 47.52242, height: 60, year: 1982, type: 'building', sourceUrl: 'https://www.emporis.com/buildings/1368143/immeuble-fiaro-antananarivo-madagascar', sourceTitle: 'FIARO Building profile', confidence: 'medium' },
  { city: 'Antananarivo', mode: 'iconic', id: 'wikidata-q1290337', name: 'Rova of Antananarivo', nameEs: 'Rova de Antananarivo', lat: -18.92365, lon: 47.53202, height: 40, year: 1820, type: 'palace_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q1290337' },
  { city: 'Belo Horizonte', mode: 'tallest', id: 'wikidata-q82800323', name: 'Edifício Aureliano Chaves', lat: -19.928416666666667, lon: -43.949888888888886, height: 121.1, year: 2014, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q82800323' },
  { city: 'Belo Horizonte', mode: 'iconic', id: 'wikidata-q18470509', name: 'Edifício Acaiaca', lat: -19.91946, lon: -43.93975, height: 120, year: 1943, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q18470509' },
  { city: 'Perth', mode: 'tallest', id: 'wikidata-q2585611', name: 'Central Park', lat: -31.95366667, lon: 115.85561111, height: 249, year: 1992, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q2585611' },
  { city: 'Perth', mode: 'iconic', id: 'wikidata-q7653429', name: 'The Bell Tower', nameEs: 'The Bell Tower', lat: -31.958903, lon: 115.858242, height: 82.5, year: 2000, type: 'bell_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q7653429' },
  { city: 'Adelaide', mode: 'tallest', id: 'wikidata-q125766623', name: 'The Adelaidean', lat: -34.92199519717401, lon: 138.60759397172538, height: 138, year: 2020, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q125766623' },
  { city: 'Adelaide', mode: 'iconic', id: 'wikidata-q2918618', name: "St Peter's Cathedral", nameEs: 'Catedral de San Pedro', lat: -34.91277778, lon: 138.59805556, height: 51, year: 1901, type: 'church_spire', sourceUrl: 'https://www.wikidata.org/wiki/Q2918618' },
  { city: 'Auckland', mode: 'tallest', id: 'wikidata-q722125', name: 'Sky Tower', lat: -36.84847, lon: 174.76231, height: 328, year: 1997, type: 'observation_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q722125' },
  { city: 'Auckland', mode: 'iconic', id: 'wikidata-q722125', name: 'Sky Tower', lat: -36.84847, lon: 174.76231, height: 328, year: 1997, type: 'observation_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q722125' },
  { city: 'Puerto del Rosario', mode: 'tallest', id: 'wikidata-q21039368', name: 'Puerto del Rosario Lighthouse', nameEs: 'Faro de Puerto del Rosario', lat: 28.505377777778, lon: -13.843755555556, height: 43, year: 1992, type: 'lighthouse', sourceUrl: 'https://www.wikidata.org/wiki/Q21039368' },
  { city: 'Puerto del Rosario', mode: 'iconic', id: 'curated-nuestra-senora-del-rosario-pdr', name: 'Nuestra Señora del Rosario church tower', nameEs: 'Torre de la iglesia de Nuestra Señora del Rosario', lat: 28.50042, lon: -13.86213, height: 20, year: 1824, type: 'church_tower', sourceUrl: 'https://www.visitfuerteventura.com/en/places-of-interest/nuestra-senora-del-rosario-church/', sourceTitle: 'Nuestra Señora del Rosario church' },
  { city: 'Santa Cruz de La Palma', mode: 'tallest', id: 'wikidata-q5637893', name: 'El Salvador church tower', nameEs: 'Torre de la iglesia de El Salvador', lat: 28.683612, lon: -17.764942, height: 25, year: 1580, type: 'church_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q5637893', confidence: 'medium' },
  { city: 'Santa Cruz de La Palma', mode: 'iconic', id: 'wikidata-q5637893', name: 'El Salvador church tower', nameEs: 'Torre de la iglesia de El Salvador', lat: 28.683612, lon: -17.764942, height: 25, year: 1580, type: 'church_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q5637893' },
  { city: 'Orlando', mode: 'tallest', id: 'wikidata-q3503721', name: '200 South Orange', lat: 28.5398, lon: -81.3799, height: 134.4, year: 1988, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q3503721' },
  { city: 'Orlando', mode: 'iconic', id: 'wikidata-q2742709', name: 'Cinderella Castle', nameEs: 'Castillo de Cenicienta', lat: 28.419411, lon: -81.5812, height: 57.6, year: 1971, type: 'castle_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q2742709' },

  { city: 'Dhaka', mode: 'iconic', id: 'curated-shaheed-minar-dhaka', name: 'Central Shaheed Minar', nameEs: 'Shaheed Minar Central', lat: 23.72756, lon: 90.39603, height: 14, year: 1963, type: 'monument', sourceUrl: 'https://en.banglapedia.org/index.php/Shaheed_Minar', sourceTitle: 'Shaheed Minar' },
  { city: 'Beijing', mode: 'iconic', id: 'wikidata-q125445', name: 'Temple of Heaven', nameEs: 'Templo del Cielo', lat: 39.8822, lon: 116.4066, height: 38, year: 1420, type: 'temple', sourceUrl: 'https://www.wikidata.org/wiki/Q125445' },
  { city: 'Chongqing', mode: 'iconic', id: 'wikidata-q6683399', name: "People's Liberation Monument", nameEs: 'Monumento a la Liberación del Pueblo', lat: 29.560167, lon: 106.573361, height: 27.5, year: 1947, type: 'monument', sourceUrl: 'https://www.wikidata.org/wiki/Q6683399' },
  { city: 'Kolkata', mode: 'iconic', id: 'wikidata-q1356352', name: 'Victoria Memorial', nameEs: 'Victoria Memorial', lat: 22.5449, lon: 88.3425, height: 56, year: 1921, type: 'monument_dome', sourceUrl: 'https://www.wikidata.org/wiki/Q1356352' },
  { city: 'Jakarta', mode: 'iconic', id: 'wikidata-q145151', name: 'National Monument (Monas)', nameEs: 'Monumento Nacional (Monas)', lat: -6.17538889, lon: 106.82713889, height: 137, year: 1975, type: 'monument', sourceUrl: 'https://www.wikidata.org/wiki/Q145151' },
  { city: 'Hong Kong', mode: 'iconic', id: 'wikidata-q214855', name: 'Bank of China Tower', lat: 22.27916667, lon: 114.16138889, height: 367.4, year: 1990, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q214855' },
  { city: 'Vienna', mode: 'iconic', id: 'wikidata-q5943', name: "St Stephen's Cathedral south tower", nameEs: 'Torre sur de la catedral de San Esteban', lat: 48.2085, lon: 16.373, height: 136.44, year: 1433, type: 'church_spire', sourceUrl: 'https://www.wikidata.org/wiki/Q5943' },
  { city: 'Hamburg', mode: 'iconic', id: 'wikidata-q674472', name: "St Michael's Church tower", nameEs: 'Torre de la iglesia de San Miguel', lat: 53.548333, lon: 9.978889, height: 132.14, year: 1786, type: 'church_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q674472' },
  { city: 'Birmingham', mode: 'iconic', id: 'wikidata-q5620988', name: 'Old Joe clock tower', nameEs: 'Torre del reloj Old Joe', lat: 52.4499, lon: -1.9307, height: 100, year: 1908, type: 'clock_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q5620988' },
  { city: 'Tirana', mode: 'iconic', id: 'curated-clock-tower-tirana', name: 'Clock Tower of Tirana', nameEs: 'Torre del Reloj de Tirana', lat: 41.32791, lon: 19.81869, height: 35, year: 1822, type: 'clock_tower', sourceUrl: 'https://tirana.al/en/points-of-interest/clock-tower/', sourceTitle: 'Clock Tower of Tirana' },
  { city: 'Lagos', mode: 'iconic', id: 'wikidata-q16733944', name: 'NECOM House', lat: 6.4461, lon: 3.39751, height: 160, year: 1979, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q16733944' },
  { city: 'Alexandria', mode: 'iconic', id: 'wikidata-q1350295', name: 'Montaza Palace tower', nameEs: 'Torre del Palacio de Montaza', lat: 31.2886, lon: 30.0159, height: 50, year: 1932, type: 'palace_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q1350295', confidence: 'medium' },
  { city: 'Abidjan', mode: 'iconic', id: 'curated-la-pyramide-abidjan', name: 'La Pyramide', lat: 5.32335, lon: -4.01971, height: 60, year: 1973, type: 'building', sourceUrl: 'https://afriquemagazine.com/la-cite-des-batisseurs', sourceTitle: 'La cité des bâtisseurs' },
  { city: 'Accra', mode: 'iconic', id: 'wikidata-q98410976', name: 'Black Star Gate', nameEs: 'Puerta de la Estrella Negra', lat: 5.54901, lon: -0.19286, height: 23, year: 1961, type: 'monument', sourceUrl: 'https://www.wikidata.org/wiki/Q98410976' },
  { city: 'Tunis', mode: 'iconic', id: 'curated-habib-bourguiba-clock', name: 'Avenue Habib Bourguiba Clock Tower', nameEs: 'Torre del Reloj de la avenida Habib Bourguiba', lat: 36.79923, lon: 10.18673, height: 38, year: 2001, type: 'clock_tower', sourceUrl: 'https://www.commune-tunis.gov.tn/', sourceTitle: 'Municipality of Tunis' },
  { city: 'Harare', mode: 'iconic', id: 'wikidata-q56064359', name: 'Reserve Bank Tower', nameEs: 'Torre del Banco de la Reserva', lat: -17.82617, lon: 31.05126, height: 120, year: 1997, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q56064359' },
  { city: 'Houston', mode: 'iconic', id: 'wikidata-q1357650', name: 'Williams Tower', lat: 29.73722222, lon: -95.46138889, height: 274.6, year: 1982, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q1357650' },
  { city: 'Miami', mode: 'iconic', id: 'wikidata-q1453542', name: 'Freedom Tower', nameEs: 'Torre de la Libertad', lat: 25.78, lon: -80.18972222, height: 78, year: 1925, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q1453542' },
  { city: 'Boston', mode: 'iconic', id: 'wikidata-q3007905', name: 'Custom House Tower', nameEs: 'Torre de la Aduana', lat: 42.35906944, lon: -71.05336944, height: 151, year: 1915, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q3007905' },
  { city: 'Bogotá', mode: 'iconic', id: 'wikidata-q3120855', name: 'Torre Colpatria', lat: 4.6108333333333, lon: -74.070277777778, height: 196, year: 1978, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q3120855' },
  { city: 'Guayaquil', mode: 'iconic', id: 'curated-torre-morisca-guayaquil', name: 'Torre Morisca', lat: -2.1952, lon: -79.8806, height: 23, year: 1931, type: 'clock_tower', sourceUrl: 'https://www.guayaquil.gob.ec/municipio-organiza-visitas-guiadas-torre-morisca-anos-inauguracion/', sourceTitle: 'Municipio organiza visitas guiadas a la Torre Morisca' },
  { city: 'Melbourne', mode: 'iconic', id: 'wikidata-q4801443', name: 'Arts Centre Melbourne spire', nameEs: 'Aguja del Arts Centre Melbourne', lat: -37.82027778, lon: 144.96833333, height: 162, year: 1984, type: 'spire', sourceUrl: 'https://www.wikidata.org/wiki/Q4801443' },
  { city: 'Suva', mode: 'iconic', id: 'wikidata-q5588695', name: 'Government Buildings clock tower', nameEs: 'Torre del reloj de los Government Buildings', lat: -18.145858, lon: 178.424413, height: 30, year: 1939, type: 'clock_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q5588695', confidence: 'medium' },
  { city: 'Valencia', mode: 'iconic', id: 'wikidata-q2975344', name: 'El Micalet', nameEs: 'El Micalet', lat: 39.47497, lon: -0.3755, height: 50.85, year: 1429, type: 'bell_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q2975344' },
  { city: 'Alicante', mode: 'iconic', id: 'wikidata-q429562', name: 'Santa Bárbara Castle keep', nameEs: 'Torre del homenaje del Castillo de Santa Bárbara', lat: 38.3494, lon: -0.4781, height: 20, year: 1580, type: 'castle_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q429562' },
  { city: 'Las Vegas', mode: 'iconic', id: 'wikidata-q845846', name: 'The STRAT tower', nameEs: 'Torre The STRAT', lat: 36.147386, lon: -115.155389, height: 350.2, year: 1996, type: 'observation_tower', sourceUrl: 'https://www.wikidata.org/wiki/Q845846' },
  { city: 'Phoenix', mode: 'iconic', id: 'wikidata-q7989806', name: 'Westward Ho tower', nameEs: 'Torre Westward Ho', lat: 33.454972, lon: -112.073839, height: 63, year: 1928, type: 'building', sourceUrl: 'https://www.wikidata.org/wiki/Q7989806' },
];

async function read(name: string) {
  const parsed = Papa.parse<Row>(await readFile(new URL(name, root), 'utf8'), { header: true, skipEmptyLines: true });
  if (parsed.errors.length) throw new Error(`${name}: ${parsed.errors.map((error) => error.message).join('; ')}`);
  return parsed.data;
}

async function write(name: string, rows: Row[], columns: string[]) {
  await writeFile(new URL(name, root), `${Papa.unparse(rows, { columns, newline: '\n' })}\n`, 'utf8');
}

const sourceId = (choice: Choice) => choice.id.startsWith('wikidata-') ? choice.id : `source-${choice.id}`;

async function main() {
  const [cities, towers, cityTowers, selections, sources, researchLog] = await Promise.all([
    read('cities.csv'), read('towers.csv'), read('city_towers.csv'), read('tower_selections.csv'), read('sources.csv'), read('research_log.csv'),
  ]);
  const cityByName = new Map(cities.map((city) => [city.city_name_en, city]));
  const towerById = new Map(towers.map((tower) => [tower.tower_id, tower]));
  const sourceById = new Map(sources.map((source) => [source.source_id, source]));
  const relationByKey = new Map(cityTowers.map((relation) => [`${relation.city_id}--${relation.tower_id}`, relation]));
  const affectedKeys = new Set<string>();

  for (const choice of choices) {
    const city = cityByName.get(choice.city);
    if (!city) throw new Error(`Unknown city ${choice.city}`);
    const sid = sourceId(choice);
    affectedKeys.add(`${city.city_id}--${choice.mode}`);
    towerById.set(choice.id, {
      tower_id: choice.id,
      tower_name: choice.name,
      tower_name_es: choice.nameEs ?? choice.name,
      latitude: String(choice.lat), longitude: String(choice.lon), height_m: String(choice.height),
      height_basis: 'structural_tip', tower_type: choice.type, completed_year: String(choice.year),
      completion_status: 'completed', coordinate_source_id: sid, height_source_id: sid,
    });
    sourceById.set(sid, {
      source_id: sid,
      publisher: choice.id.startsWith('wikidata-') ? 'Wikidata contributors' : new URL(choice.sourceUrl).hostname,
      title: choice.sourceTitle ?? `${choice.name} entity record`,
      url: choice.sourceUrl,
      accessed_at: reviewedAt,
      source_type: 'tower identity, coordinates and height review',
      licence_note: choice.id.startsWith('wikidata-') ? 'CC0 structured data; editorially reviewed' : 'Reference source; facts independently recorded',
    });
    const relationKey = `${city.city_id}--${choice.id}`;
    const relation = relationByKey.get(relationKey) ?? {
      city_id: city.city_id, tower_id: choice.id, tallest_eligible: 'false', iconic_candidate: 'false',
      association_source_id: sid, disqualification_reason: '', review_status: 'approved',
    };
    relation[choice.mode === 'tallest' ? 'tallest_eligible' : 'iconic_candidate'] = 'true';
    relation.association_source_id = sid;
    relation.review_status = 'approved';
    relationByKey.set(relationKey, relation);
  }

  const retainedSelections = selections.filter((selection) => !affectedKeys.has(`${selection.city_id}--${selection.mode}`));
  const newSelections = choices.map((choice) => {
    const city = cityByName.get(choice.city)!;
    const tallest = choice.mode === 'tallest';
    return {
      city_id: city.city_id,
      mode: choice.mode,
      tower_id: choice.id,
      co_tallest: 'false',
      selection_reason_en: tallest
        ? `${choice.name} is the highest completed eligible landmark confirmed for ${city.city_name_en} in this editorial review.`
        : `${choice.name} was selected as the permanent vertical landmark most strongly associated with ${city.city_name_en}.`,
      selection_reason_es: tallest
        ? `${choice.nameEs ?? choice.name} es el hito elegible completado más alto confirmado para ${city.city_name_es} en esta revisión editorial.`
        : `${choice.nameEs ?? choice.name} se seleccionó como el hito vertical permanente con mayor asociación a ${city.city_name_es}.`,
      confidence: choice.confidence ?? 'high',
      selection_source_id: sourceId(choice),
      reviewer: 'editorial choice approved by project owner',
      reviewed_at: reviewedAt,
    };
  });

  const affectedCities = new Set(choices.map((choice) => cityByName.get(choice.city)!.city_id));
  for (const issue of researchLog) {
    if (affectedCities.has(issue.entity_id) && ['candidate_fallback', 'low_confidence_iconic', 'placeholder'].includes(issue.issue_type)) {
      issue.status = 'resolved';
      issue.decision = 'Replaced by the project owner’s approved editorial choice and supporting landmark record.';
      issue.resolved_at = reviewedAt;
    }
  }

  await Promise.all([
    write('towers.csv', [...towerById.values()], ['tower_id','tower_name','tower_name_es','latitude','longitude','height_m','height_basis','tower_type','completed_year','completion_status','coordinate_source_id','height_source_id']),
    write('city_towers.csv', [...relationByKey.values()], ['city_id','tower_id','tallest_eligible','iconic_candidate','association_source_id','disqualification_reason','review_status']),
    write('tower_selections.csv', [...retainedSelections, ...newSelections], ['city_id','mode','tower_id','co_tallest','selection_reason_en','selection_reason_es','confidence','selection_source_id','reviewer','reviewed_at']),
    write('sources.csv', [...sourceById.values()], ['source_id','publisher','title','url','accessed_at','source_type','licence_note']),
    write('research_log.csv', researchLog, ['issue_id','entity_type','entity_id','issue_type','severity','status','decision','evidence_source_id','owner','opened_at','resolved_at']),
  ]);
  console.log(`Applied ${choices.length} approved selections across ${affectedCities.size} cities.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
