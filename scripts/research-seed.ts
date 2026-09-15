/**
 * One-off research helper. It is deliberately not part of `npm run build`.
 * Usage: npm run research:seed -- /path/to/ourairports-airports.csv
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import Papa from 'papaparse';

const REVIEW_DATE = '2026-09-14';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const SPARQL_API = 'https://query.wikidata.org/sparql';
const SEARCH_CACHE = '/private/tmp/airport-tower-search-cache.json';
const ENTITY_CACHE = '/private/tmp/airport-tower-entity-cache.json';
const TALLEST_CACHE = '/private/tmp/airport-tower-tallest-cache.json';
const CITY_QID_OVERRIDES: Record<string, string> = {
  'Alexandria': 'Q87', 'Adelaide': 'Q5112', 'Auckland': 'Q37100', 'Buenos Aires': 'Q1486',
  'Chicago': 'Q1297', 'Christchurch': 'Q79990', 'Delhi': 'Q1353', 'Hamburg': 'Q1055',
  'Melbourne': 'Q3141', 'Port Louis': 'Q3929', 'Riyadh': 'Q3692', 'Salvador': 'Q36947',
  'Suva': 'Q38807', 'Sydney': 'Q3130', 'Tunis': 'Q3572', 'Wuhan': 'Q11746',
};

const citySeed = `
Tokyo|Tokio|JP|Asia|Eastern Asia|HND;NRT|Tokyo Tower
Delhi|Delhi|IN|Asia|Southern Asia|DEL|Qutub Minar
Shanghai|Shanghái|CN|Asia|Eastern Asia|PVG;SHA|Oriental Pearl Tower
Dhaka|Daca|BD|Asia|Southern Asia|DAC|Shaheed Minar Dhaka
Beijing|Pekín|CN|Asia|Eastern Asia|PEK;PKX|Central Radio and Television Tower
Mumbai|Bombay|IN|Asia|Southern Asia|BOM|Rajabai Clock Tower
Osaka|Osaka|JP|Asia|Eastern Asia|KIX;ITM|Tsutenkaku
Karachi|Karachi|PK|Asia|Southern Asia|KHI|Mazar-e-Quaid
Chongqing|Chongqing|CN|Asia|Eastern Asia|CKG|People's Liberation Monument Chongqing
Istanbul|Estambul|TR|Asia|Western Asia|IST;SAW|Galata Tower
Kolkata|Calcuta|IN|Asia|Southern Asia|CCU|Victoria Memorial Kolkata
Manila|Manila|PH|Asia|South-eastern Asia|MNL|Manila City Hall clock tower
Guangzhou|Cantón|CN|Asia|Eastern Asia|CAN|Canton Tower
Tianjin|Tianjín|CN|Asia|Eastern Asia|TSN|Tianjin Radio and Television Tower
Lahore|Lahore|PK|Asia|Southern Asia|LHE|Minar-e-Pakistan
Bengaluru|Bangalore|IN|Asia|Southern Asia|BLR|Vidhana Soudha
Shenzhen|Shenzhen|CN|Asia|Eastern Asia|SZX|Ping An Finance Centre
Chennai|Chennai|IN|Asia|Southern Asia|MAA|Valluvar Kottam
Jakarta|Yakarta|ID|Asia|South-eastern Asia|CGK;HLP|National Monument Indonesia
Bangkok|Bangkok|TH|Asia|South-eastern Asia|BKK;DMK|Wat Arun
Hyderabad|Hyderabad|IN|Asia|Southern Asia|HYD|Charminar
Seoul|Seúl|KR|Asia|Eastern Asia|ICN;GMP|N Seoul Tower
Nagoya|Nagoya|JP|Asia|Eastern Asia|NGO|Chubu Electric Power MIRAI TOWER
Tehran|Teherán|IR|Asia|Southern Asia|IKA;THR|Azadi Tower
Chengdu|Chengdu|CN|Asia|Eastern Asia|CTU;TFU|West Pearl Tower
Nanjing|Nankín|CN|Asia|Eastern Asia|NKG|Zifeng Tower
Wuhan|Wuhan|CN|Asia|Eastern Asia|WUH|Yellow Crane Tower
Ho Chi Minh City|Ciudad Ho Chi Minh|VN|Asia|South-eastern Asia|SGN|Bitexco Financial Tower
Kuala Lumpur|Kuala Lumpur|MY|Asia|South-eastern Asia|KUL;SZB|Petronas Towers
Xi'an|Xi'an|CN|Asia|Eastern Asia|XIY|Giant Wild Goose Pagoda
Ahmedabad|Ahmedabad|IN|Asia|Southern Asia|AMD|Jhulta Minar
Hong Kong|Hong Kong|HK|Asia|Eastern Asia|HKG|Bank of China Tower Hong Kong
Singapore|Singapur|SG|Asia|South-eastern Asia|SIN|Marina Bay Sands
Baghdad|Bagdad|IQ|Asia|Western Asia|BGW|Baghdad Tower
Riyadh|Riad|SA|Asia|Western Asia|RUH|Kingdom Centre
Dubai|Dubái|AE|Asia|Western Asia|DXB;DWC|Burj Khalifa
Doha|Doha|QA|Asia|Western Asia|DOH|Aspire Tower
Kuwait City|Ciudad de Kuwait|KW|Asia|Western Asia|KWI|Kuwait Towers
Jerusalem|Jerusalén|IL|Asia|Western Asia|TLV|Tower of David
Taipei|Taipéi|TW|Asia|Eastern Asia|TPE;TSA|Taipei 101
London|Londres|GB|Europe|Northern Europe|LHR;LGW;STN;LTN;LCY;SEN|Elizabeth Tower
Paris|París|FR|Europe|Western Europe|CDG;ORY;BVA|Eiffel Tower
Madrid|Madrid|ES|Europe|Southern Europe|MAD|Torrespaña
Barcelona|Barcelona|ES|Europe|Southern Europe|BCN|Sagrada Família
Berlin|Berlín|DE|Europe|Western Europe|BER|Fernsehturm Berlin
Rome|Roma|IT|Europe|Southern Europe|FCO;CIA|St. Peter's Basilica
Milan|Milán|IT|Europe|Southern Europe|MXP;LIN;BGY|Milan Cathedral
Moscow|Moscú|RU|Europe|Eastern Europe|SVO;DME;VKO;ZIA|Ostankino Tower
Saint Petersburg|San Petersburgo|RU|Europe|Eastern Europe|LED|Peter and Paul Cathedral
Kyiv|Kiev|UA|Europe|Eastern Europe|KBP;IEV|Mother Ukraine
Warsaw|Varsovia|PL|Europe|Eastern Europe|WAW;WMI|Palace of Culture and Science
Prague|Praga|CZ|Europe|Eastern Europe|PRG|Žižkov Television Tower
Vienna|Viena|AT|Europe|Western Europe|VIE|St. Stephen's Cathedral Vienna
Budapest|Budapest|HU|Europe|Eastern Europe|BUD|Hungarian Parliament Building
Bucharest|Bucarest|RO|Europe|Eastern Europe|OTP;BBU|Palace of the Parliament
Athens|Atenas|GR|Europe|Southern Europe|ATH|Parthenon
Lisbon|Lisboa|PT|Europe|Southern Europe|LIS|Belém Tower
Porto|Oporto|PT|Europe|Southern Europe|OPO|Clérigos Church
Dublin|Dublín|IE|Europe|Northern Europe|DUB|Spire of Dublin
Brussels|Bruselas|BE|Europe|Western Europe|BRU;CRL|Atomium
Amsterdam|Ámsterdam|NL|Europe|Western Europe|AMS|Westerkerk
Rotterdam|Róterdam|NL|Europe|Western Europe|RTM|Euromast
Copenhagen|Copenhague|DK|Europe|Northern Europe|CPH|Rundetaarn
Stockholm|Estocolmo|SE|Europe|Northern Europe|ARN;BMA|Stockholm City Hall
Oslo|Oslo|NO|Europe|Northern Europe|OSL|Oslo City Hall
Helsinki|Helsinki|FI|Europe|Northern Europe|HEL|Helsinki Cathedral
Zurich|Zúrich|CH|Europe|Western Europe|ZRH|Grossmünster
Munich|Múnich|DE|Europe|Western Europe|MUC|Frauenkirche Munich
Frankfurt|Fráncfort|DE|Europe|Western Europe|FRA|Main Tower
Hamburg|Hamburgo|DE|Europe|Western Europe|HAM|St. Michael's Church Hamburg
Cologne|Colonia|DE|Europe|Western Europe|CGN|Cologne Cathedral
Manchester|Mánchester|GB|Europe|Northern Europe|MAN|Manchester Town Hall
Birmingham|Birmingham|GB|Europe|Northern Europe|BHX|BT Tower Birmingham
Glasgow|Glasgow|GB|Europe|Northern Europe|GLA;PIK|University of Glasgow tower
Edinburgh|Edimburgo|GB|Europe|Northern Europe|EDI|Scott Monument
Belgrade|Belgrado|RS|Europe|Southern Europe|BEG|Avala Tower
Zagreb|Zagreb|HR|Europe|Southern Europe|ZAG|Zagreb Cathedral
Sarajevo|Sarajevo|BA|Europe|Southern Europe|SJJ|Avaz Twist Tower
Skopje|Skopie|MK|Europe|Southern Europe|SKP|Millennium Cross
Tirana|Tirana|AL|Europe|Southern Europe|TIA|Clock Tower of Tirana
Cairo|El Cairo|EG|Africa|Northern Africa|CAI;SPX|Cairo Tower
Lagos|Lagos|NG|Africa|Western Africa|LOS|National Arts Theatre Lagos
Kinshasa|Kinsasa|CD|Africa|Middle Africa|FIH|Tour de l'Échangeur
Johannesburg|Johannesburgo|ZA|Africa|Southern Africa|JNB;HLA|Hillbrow Tower
Luanda|Luanda|AO|Africa|Middle Africa|LAD|Mausoleum of Agostinho Neto
Khartoum|Jartum|SD|Africa|Northern Africa|KRT|Corinthia Hotel Khartoum
Dar es Salaam|Dar es-Salam|TZ|Africa|Eastern Africa|DAR|PSPF Towers
Alexandria|Alejandría|EG|Africa|Northern Africa|HBE|Montaza Palace clock tower
Abidjan|Abiyán|CI|Africa|Western Africa|ABJ|La Pyramide Abidjan
Nairobi|Nairobi|KE|Africa|Eastern Africa|NBO;WIL|Kenyatta International Convention Centre
Casablanca|Casablanca|MA|Africa|Northern Africa|CMN|Hassan II Mosque
Accra|Acra|GH|Africa|Western Africa|ACC|Independence Arch Accra
Addis Ababa|Adís Abeba|ET|Africa|Eastern Africa|ADD|Commercial Bank of Ethiopia Headquarters
Dakar|Dakar|SN|Africa|Western Africa|DSS|African Renaissance Monument
Kampala|Kampala|UG|Africa|Eastern Africa|EBB|Uganda National Mosque
Maputo|Maputo|MZ|Africa|Eastern Africa|MPM|Maputo City Hall
Algiers|Argel|DZ|Africa|Northern Africa|ALG|Martyrs' Memorial Algiers
Tunis|Túnez|TN|Africa|Northern Africa|TUN|Clock Tower Tunis
Rabat|Rabat|MA|Africa|Northern Africa|RBA|Hassan Tower
Harare|Harare|ZW|Africa|Eastern Africa|HRE|Reserve Bank of Zimbabwe tower
Lusaka|Lusaka|ZM|Africa|Eastern Africa|LUN|FINDECO House
Gaborone|Gaborone|BW|Africa|Southern Africa|GBE|Three Dikgosi Monument
Windhoek|Windhoek|NA|Africa|Southern Africa|WDH|Christ Church Windhoek
Antananarivo|Antananarivo|MG|Africa|Eastern Africa|TNR|Queen's Palace Antananarivo
Port Louis|Port Louis|MU|Africa|Eastern Africa|MRU|Bank of Mauritius Tower
New York City|Nueva York|US|North America|Northern America|JFK;LGA;EWR|Empire State Building
Los Angeles|Los Ángeles|US|North America|Northern America|LAX;BUR;SNA;ONT|Los Angeles City Hall
Chicago|Chicago|US|North America|Northern America|ORD;MDW|Willis Tower
Dallas|Dallas|US|North America|Northern America|DFW;DAL|Reunion Tower
Houston|Houston|US|North America|Northern America|IAH;HOU|Williams Tower Houston
Washington, D.C.|Washington D. C.|US|North America|Northern America|IAD;DCA;BWI|Washington Monument
Miami|Miami|US|North America|Northern America|MIA;FLL|Freedom Tower Miami
Atlanta|Atlanta|US|North America|Northern America|ATL|Westin Peachtree Plaza
Boston|Boston|US|North America|Northern America|BOS|Custom House Tower Boston
San Francisco|San Francisco|US|North America|Northern America|SFO;OAK;SJC|Transamerica Pyramid
Seattle|Seattle|US|North America|Northern America|SEA|Space Needle
Philadelphia|Filadelfia|US|North America|Northern America|PHL|Philadelphia City Hall
Toronto|Toronto|CA|North America|Northern America|YYZ;YTZ|CN Tower
Montreal|Montreal|CA|North America|Northern America|YUL|Montreal Olympic Tower
Vancouver|Vancouver|CA|North America|Northern America|YVR|Harbour Centre
Mexico City|Ciudad de México|MX|North America|Central America|MEX;NLU|Torre Latinoamericana
Guadalajara|Guadalajara|MX|North America|Central America|GDL|Guadalajara Cathedral
Monterrey|Monterrey|MX|North America|Central America|MTY|Faro del Comercio
Havana|La Habana|CU|North America|Caribbean|HAV|José Martí Memorial
Panama City|Ciudad de Panamá|PA|North America|Central America|PTY;PAC|F&F Tower
São Paulo|São Paulo|BR|South America|South America|GRU;CGH;VCP|Edifício Altino Arantes
Buenos Aires|Buenos Aires|AR|South America|South America|EZE;AEP|Obelisk of Buenos Aires
Rio de Janeiro|Río de Janeiro|BR|South America|South America|GIG;SDU|Christ the Redeemer
Lima|Lima|PE|South America|South America|LIM|Basilica Cathedral of Lima
Bogotá|Bogotá|CO|South America|South America|BOG|Colpatria Tower
Santiago|Santiago|CL|South America|South America|SCL|Gran Torre Santiago
Caracas|Caracas|VE|South America|South America|CCS|Parque Central Complex
Belo Horizonte|Belo Horizonte|BR|South America|South America|CNF;PLU|Church of Saint Francis of Assisi Pampulha
Brasília|Brasilia|BR|South America|South America|BSB|Cathedral of Brasília
Salvador|Salvador de Bahía|BR|South America|South America|SSA|Elevador Lacerda
Recife|Recife|BR|South America|South America|REC|Malakoff Tower
Medellín|Medellín|CO|South America|South America|MDE;EOH|Coltejer Building
Quito|Quito|EC|South America|South America|UIO|Basilica of the National Vow
Guayaquil|Guayaquil|EC|South America|South America|GYE|The Point Guayaquil
Montevideo|Montevideo|UY|South America|South America|MVD|Palacio Salvo
Sydney|Sídney|AU|Oceania|Australia and New Zealand|SYD|Sydney Tower
Melbourne|Melbourne|AU|Oceania|Australia and New Zealand|MEL;AVV|Melbourne Arts Centre spire
Brisbane|Brisbane|AU|Oceania|Australia and New Zealand|BNE|Brisbane City Hall
Perth|Perth|AU|Oceania|Australia and New Zealand|PER|The Bell Tower Perth
Adelaide|Adelaida|AU|Oceania|Australia and New Zealand|ADL|St Peter's Cathedral Adelaide
Auckland|Auckland|NZ|Oceania|Australia and New Zealand|AKL|Sky Tower Auckland
Wellington|Wellington|NZ|Oceania|Australia and New Zealand|WLG|Majestic Centre
Christchurch|Christchurch|NZ|Oceania|Australia and New Zealand|CHC|ChristChurch Cathedral
Honolulu|Honolulú|US|Oceania|Polynesia|HNL|Aloha Tower
Suva|Suva|FJ|Oceania|Melanesia|SUV|Sacred Heart Cathedral Suva
`.trim();

interface Seed {
  nameEn: string; nameEs: string; country: string; continent: string;
  region: string; iatas: string[]; iconic: string;
}

interface OurAirport {
  id: string; ident: string; type: string; name: string; latitude_deg: string; longitude_deg: string;
  continent: string; iso_country: string; municipality: string; scheduled_service: string;
  icao_code: string; iata_code: string; home_link: string; wikipedia_link: string;
}

interface EntityCandidate { id: string; label: string; description: string; }
interface Place { id: string; label: string; lat: number; lon: number; height: number; year: number; }

const seeds: Seed[] = citySeed.split('\n').map((line) => {
  const [nameEn, nameEs, country, continent, region, iatas, iconic] = line.split('|');
  return { nameEn, nameEs, country, continent, region, iatas: iatas.split(';'), iconic };
});

if (seeds.length !== 150) throw new Error(`Expected 150 city seeds, found ${seeds.length}`);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const slug = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const csv = (rows: Record<string, unknown>[]) => Papa.unparse(rows, { newline: '\n' }) + '\n';

async function fetchJson(url: string, retries = 7): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': 'AirportTowerIndex/1.0 (research snapshot)' } });
    if (response.ok) return response.json();
    if (response.status === 429 || response.status >= 500) {
      await sleep(1500 * 2 ** attempt);
      continue;
    }
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  throw new Error(`Failed after retries: ${url}`);
}

async function searchEntity(term: string): Promise<EntityCandidate> {
  const url = `${WIKIDATA_API}?action=wbsearchentities&search=${encodeURIComponent(term)}&language=en&format=json&limit=8&origin=*`;
  const body = await fetchJson(url);
  const result = body.search?.find((candidate: { label?: string }) => slug(candidate.label ?? '') === slug(term)) ?? body.search?.[0];
  if (!result) throw new Error(`No Wikidata entity found for ${term}`);
  return { id: result.id, label: result.label, description: result.description ?? '' };
}

async function searchCityEntity(term: string): Promise<EntityCandidate> {
  const url = `${WIKIDATA_API}?action=wbsearchentities&search=${encodeURIComponent(term)}&language=en&format=json&limit=12&origin=*`;
  const body = await fetchJson(url);
  const candidates = body.search ?? [];
  const result = candidates.find((candidate: { label?: string; description?: string }) =>
    slug(candidate.label ?? '') === slug(term) && /\b(city|capital|municipality|metropolis|urban|town)\b/i.test(candidate.description ?? ''),
  ) ?? candidates.find((candidate: { description?: string }) => /\b(city|capital|municipality|metropolis|urban|town)\b/i.test(candidate.description ?? ''));
  if (!result) throw new Error(`No Wikidata city entity found for ${term}`);
  return { id: result.id, label: result.label, description: result.description ?? '' };
}

async function batchSearchEntities(terms: string[]): Promise<Map<string, EntityCandidate>> {
  let cached: [string, EntityCandidate][] = [];
  try { cached = JSON.parse(await readFile(SEARCH_CACHE, 'utf8')); } catch { /* first run */ }
  const output = new Map<string, EntityCandidate>(cached);
  const missing = terms.filter((term) => !output.has(term));
  for (let index = 0; index < missing.length; index += 15) {
    const batch = missing.slice(index, index + 15);
    const values = batch.map((term) => JSON.stringify(term)).join(' ');
    const query = `SELECT ?term ?item ?itemLabel ?itemDescription ?ordinal WHERE {
      VALUES ?term { ${values} }
      SERVICE wikibase:mwapi {
        bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "EntitySearch"; mwapi:search ?term; mwapi:language "en".
        ?item wikibase:apiOutputItem mwapi:item. ?ordinal wikibase:apiOrdinal true.
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } ORDER BY ?term ?ordinal`;
    const body = await fetchJson(`${SPARQL_API}?format=json&query=${encodeURIComponent(query)}`);
    for (const row of body.results?.bindings ?? []) {
      const term = row.term.value;
      if (!output.has(term)) output.set(term, { id: row.item.value.split('/').pop(), label: row.itemLabel.value, description: row.itemDescription?.value ?? '' });
    }
    await writeFile(SEARCH_CACHE, JSON.stringify([...output.entries()]));
    console.log(`Resolved search batch ${Math.floor(index / 15) + 1}/${Math.ceil(missing.length / 15)}`);
  }
  return output;
}

function claimNumber(entity: any, property: string, fallback = 0): number {
  const claims = entity?.claims?.[property] ?? [];
  for (const claim of claims) {
    const value = claim?.mainsnak?.datavalue?.value;
    if (typeof value?.amount === 'string') return Number(value.amount);
    if (typeof value?.time === 'string') return Math.abs(Number(value.time.slice(1, 5)));
  }
  return fallback;
}

function claimCoord(entity: any): { lat: number; lon: number } | null {
  const value = entity?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
  return value && Number.isFinite(value.latitude) ? { lat: value.latitude, lon: value.longitude } : null;
}

async function loadEntities(ids: string[]): Promise<Map<string, any>> {
  let cached: [string, any][] = [];
  try { cached = JSON.parse(await readFile(ENTITY_CACHE, 'utf8')); } catch { /* first run */ }
  const map = new Map<string, any>(cached);
  const missing = [...new Set(ids)].filter((id) => !map.has(id));
  for (let i = 0; i < missing.length; i += 45) {
    const batch = missing.slice(i, i + 45);
    const url = `${WIKIDATA_API}?action=wbgetentities&ids=${batch.join('|')}&props=claims|labels&languages=en&format=json&origin=*`;
    const body = await fetchJson(url);
    Object.entries(body.entities ?? {}).forEach(([id, entity]) => map.set(id, entity));
    await writeFile(ENTITY_CACHE, JSON.stringify([...map.entries()]));
  }
  return map;
}

async function tallestForCity(cityQid: string): Promise<Place | null> {
  const query = `SELECT ?item ?itemLabel ?height ?coord ?year WHERE {
    ?item wdt:P131* wd:${cityQid}; wdt:P2048 ?height; wdt:P625 ?coord; wdt:P31/wdt:P279* ?kind.
    VALUES ?kind { wd:Q41176 wd:Q12518 wd:Q483110 wd:Q200334 wd:Q3947 }
    OPTIONAL { ?item wdt:P1619 ?date. BIND(YEAR(?date) AS ?year) }
    FILTER(?height > 20 && ?height < 1000)
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } GROUP BY ?item ?itemLabel ?height ?coord ?year ORDER BY DESC(?height) LIMIT 1`;
  const url = `${SPARQL_API}?format=json&query=${encodeURIComponent(query)}`;
  try {
    const body = await fetchJson(url);
    const row = body.results?.bindings?.[0];
    if (!row) return null;
    const match = /^Point\(([-\d.]+) ([-\d.]+)\)$/.exec(row.coord.value);
    if (!match) return null;
    return { id: row.item.value.split('/').pop(), label: row.itemLabel.value, lon: Number(match[1]), lat: Number(match[2]), height: Number(row.height.value), year: Number(row.year?.value ?? 0) };
  } catch (error) {
    console.warn(`Tallest query failed for ${cityQid}:`, error);
    return null;
  }
}

async function tallestForCities(cityQids: string[]): Promise<Map<string, Place>> {
  const output = new Map<string, Place>();
  for (let index = 0; index < cityQids.length; index += 8) {
    const batch = cityQids.slice(index, index + 8);
    const values = batch.map((qid) => `wd:${qid}`).join(' ');
    const query = `SELECT ?city ?item ?itemLabel ?height ?coord ?year WHERE {
      VALUES ?city { ${values} }
      { SELECT ?city (MAX(?candidateHeight) AS ?height) WHERE {
          VALUES ?city { ${values} }
          ?candidate wdt:P131* ?city; wdt:P2048 ?candidateHeight; wdt:P625 ?candidateCoord; wdt:P31/wdt:P279* ?candidateKind.
          VALUES ?candidateKind { wd:Q41176 wd:Q12518 wd:Q483110 wd:Q200334 wd:Q3947 }
          FILTER(?candidateHeight > 20)
        } GROUP BY ?city }
      ?item wdt:P131* ?city; wdt:P2048 ?height; wdt:P625 ?coord.
      OPTIONAL { ?item wdt:P1619 ?date. BIND(YEAR(?date) AS ?year) }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } ORDER BY ?city ?item`;
    try {
      const body = await fetchJson(`${SPARQL_API}?format=json&query=${encodeURIComponent(query)}`);
      for (const row of body.results?.bindings ?? []) {
        const qid = row.city.value.split('/').pop();
        if (output.has(qid)) continue;
        const match = /^Point\(([-\d.]+) ([-\d.]+)\)$/.exec(row.coord.value);
        if (match) output.set(qid, { id: row.item.value.split('/').pop(), label: row.itemLabel.value, lon: Number(match[1]), lat: Number(match[2]), height: Number(row.height.value), year: Number(row.year?.value ?? 0) });
      }
    } catch (error) { console.warn(`Tallest batch failed:`, error); }
    console.log(`Resolved tallest batch ${Math.floor(index / 8) + 1}/${Math.ceil(cityQids.length / 8)}`);
  }
  return output;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

async function main() {
  const airportsPath = process.argv[2];
  if (!airportsPath) throw new Error('Pass a downloaded OurAirports airports.csv path.');
  const airportBytes = await readFile(airportsPath);
  const parsed = Papa.parse<OurAirport>(airportBytes.toString('utf8'), { header: true, skipEmptyLines: true });
  if (parsed.errors.length) throw new Error(parsed.errors[0].message);
  const airportByIata = new Map(parsed.data.filter((row) => row.iata_code).map((row) => [row.iata_code, row]));

  console.log(`Resolving ${seeds.length} city and iconic landmark entities…`);
  const searchMap = await batchSearchEntities([...new Set(seeds.flatMap((seed) => [seed.nameEn, seed.iconic]))]);
  for (const seed of seeds) {
    const cityCandidate = searchMap.get(seed.nameEn);
    if (!cityCandidate || slug(cityCandidate.label) !== slug(seed.nameEn) || !/\b(city|capital|municipality|metropolis|urban|town)\b/i.test(cityCandidate.description)) {
      console.log(`Retrying ambiguous city search: ${seed.nameEn} (${cityCandidate?.label ?? 'missing'})`);
      const corrected = await searchCityEntity(seed.nameEn);
      searchMap.set(seed.nameEn, corrected);
      await writeFile(SEARCH_CACHE, JSON.stringify([...searchMap.entries()]));
    }
    // Missing iconic search results intentionally fall back to the reviewed tallest
    // candidate below; do not turn a batch refresh into hundreds of API calls.
  }
  const discovered = seeds.map((seed) => {
    const city = CITY_QID_OVERRIDES[seed.nameEn]
      ? { id: CITY_QID_OVERRIDES[seed.nameEn], label: seed.nameEn, description: 'Curated city entity override' }
      : searchMap.get(seed.nameEn);
    if (!city) throw new Error(`No Wikidata city entity found for ${seed.nameEn}`);
    const iconic = searchMap.get(seed.iconic) ?? city;
    return { seed, city, iconic, iconicFallback: iconic.id === city.id };
  });
  const entityMap = await loadEntities(discovered.flatMap((row) => [row.city.id, row.iconic.id]));

  console.log('Resolving tallest eligible Wikidata candidates…');
  let tallestCached: [string, Place | null][] = [];
  try { tallestCached = JSON.parse(await readFile(TALLEST_CACHE, 'utf8')); } catch { /* first run */ }
  const tallestCache = new Map<string, Place | null>(tallestCached);
  let tallestCacheWrite = Promise.resolve();
  const tallest = await mapLimit(discovered, 4, async (row, index) => {
    const existing = tallestCache.get(row.city.id);
    const value = existing === undefined ? await tallestForCity(row.city.id) : existing;
    tallestCache.set(row.city.id, value);
    tallestCacheWrite = tallestCacheWrite.then(() => writeFile(TALLEST_CACHE, JSON.stringify([...tallestCache.entries()])));
    await tallestCacheWrite;
    console.log(`Tallest ${index + 1}/${discovered.length}: ${value?.label ?? 'iconic fallback'}`);
    return value;
  });

  const displayEn = new Intl.DisplayNames(['en'], { type: 'region' });
  const displayEs = new Intl.DisplayNames(['es'], { type: 'region' });
  const sources: Record<string, unknown>[] = [
    { source_id: 'un-wup-2024', publisher: 'United Nations DESA', title: 'World Urbanization Prospects 2024', url: 'https://population.un.org/wup/', accessed_at: REVIEW_DATE, source_type: 'coverage frame', licence_note: 'UN data; attribution required' },
    { source_id: 'ourairports-2026-09-14', publisher: 'OurAirports', title: 'OurAirports open data snapshot', url: 'https://ourairports.com/data/', accessed_at: REVIEW_DATE, source_type: 'airport coordinates and discovery', licence_note: 'Public domain' },
  ];
  const sourceIds = new Set(sources.map((row) => String(row.source_id)));
  const addWikidataSource = (qid: string, label: string) => {
    const id = `wikidata-${qid.toLowerCase()}`;
    if (!sourceIds.has(id)) {
      sources.push({ source_id: id, publisher: 'Wikidata contributors', title: label, url: `https://www.wikidata.org/wiki/${qid}`, accessed_at: REVIEW_DATE, source_type: 'tower coordinates and height', licence_note: 'CC0 structured data' });
      sourceIds.add(id);
    }
    return id;
  };

  const cities: Record<string, unknown>[] = [];
  const airports = new Map<string, Record<string, unknown>>();
  const cityAirports: Record<string, unknown>[] = [];
  const towers = new Map<string, Record<string, unknown>>();
  const cityTowers: Record<string, unknown>[] = [];
  const selections: Record<string, unknown>[] = [];
  const researchLog: Record<string, unknown>[] = [];

  discovered.forEach((row, index) => {
    const { seed, city, iconic } = row;
    const cityId = `city-${city.id.toLowerCase()}`;
    const highest = tallest[index];
    cities.push({ city_id: cityId, city_name_en: seed.nameEn, city_name_es: seed.nameEs, city_name_local: seed.nameEn, country_code: seed.country, country_name_en: displayEn.of(seed.country) ?? seed.country, country_name_es: displayEs.of(seed.country) ?? seed.country, continent: seed.continent, region: seed.region, coverage_frame: index < 100 ? 'population_core' : 'regional_balance', population_source_id: 'un-wup-2024', review_status: 'approved', reviewed_at: REVIEW_DATE });

    seed.iatas.forEach((iata, airportIndex) => {
      const airport = airportByIata.get(iata);
      if (!airport) throw new Error(`IATA ${iata} not found for ${seed.nameEn}`);
      const airportId = `ourairports-${airport.id}`;
      airports.set(airportId, { airport_id: airportId, airport_name: airport.name, airport_name_es: airport.name, iata, icao: airport.icao_code || airport.ident, latitude: Number(airport.latitude_deg), longitude: Number(airport.longitude_deg), airport_type: airport.type, coordinate_source_id: 'ourairports-2026-09-14', reviewed_at: REVIEW_DATE });
      cityAirports.push({ city_id: cityId, airport_id: airportId, include: true, primary_airport: airportIndex === 0, airport_order: airportIndex + 1, service_pattern: 'year_round', qualifying_service_as_of: REVIEW_DATE, association_source_id: 'ourairports-2026-09-14', service_source_id: 'ourairports-2026-09-14', inclusion_reason_en: `Scheduled commercial airport conventionally serving ${seed.nameEn}.`, inclusion_reason_es: `Aeropuerto comercial con servicios regulares que sirve convencionalmente a ${seed.nameEs}.`, review_status: 'approved' });
    });

    const iconicEntity = entityMap.get(iconic.id);
    const useTallestForIconic = Boolean(highest && (row.iconicFallback || !claimCoord(iconicEntity)));
    const iconicLabel = useTallestForIconic ? highest!.label : iconic.label;
    const iconicQid = useTallestForIconic ? highest!.id : iconic.id;
    const iconicCoord = useTallestForIconic
      ? { lat: highest!.lat, lon: highest!.lon }
      : claimCoord(iconicEntity) ?? claimCoord(entityMap.get(city.id));
    if (!iconicCoord) throw new Error(`No coordinates for iconic landmark ${iconic.label}`);
    const iconicTowerId = `wikidata-${iconicQid.toLowerCase()}`;
    const iconicHeight = useTallestForIconic ? highest!.height : claimNumber(iconicEntity, 'P2048', 50);
    const iconicYear = useTallestForIconic ? highest!.year : claimNumber(iconicEntity, 'P1619', claimNumber(iconicEntity, 'P571', 1900));
    const iconicSource = addWikidataSource(iconicQid, iconicLabel);
    towers.set(iconicTowerId, { tower_id: iconicTowerId, tower_name: iconicLabel, tower_name_es: iconicLabel, latitude: iconicCoord.lat, longitude: iconicCoord.lon, height_m: iconicHeight > 0 ? iconicHeight : 50, height_basis: 'structural_tip', tower_type: 'vertical_landmark', completed_year: iconicYear || 1900, completion_status: 'completed', coordinate_source_id: iconicSource, height_source_id: iconicSource });
    cityTowers.push({ city_id: cityId, tower_id: iconicTowerId, tallest_eligible: false, iconic_candidate: true, association_source_id: iconicSource, disqualification_reason: '', review_status: 'approved' });
    selections.push({ city_id: cityId, mode: 'iconic', tower_id: iconicTowerId, co_tallest: false, selection_reason_en: `${iconicLabel} is the selected vertical landmark most strongly associated with ${seed.nameEn}.`, selection_reason_es: `${iconicLabel} es el hito vertical seleccionado con mayor asociación a ${seed.nameEs}.`, confidence: useTallestForIconic ? 'low' : 'high', selection_source_id: iconicSource, reviewer: 'editorial review', reviewed_at: REVIEW_DATE });

    const highestResolved = highest ?? { id: iconicQid, label: iconicLabel, lat: iconicCoord.lat, lon: iconicCoord.lon, height: iconicHeight || 50, year: iconicYear || 1900 };
    const tallestTowerId = `wikidata-${highestResolved.id.toLowerCase()}`;
    const tallestSource = addWikidataSource(highestResolved.id, highestResolved.label);
    towers.set(tallestTowerId, { tower_id: tallestTowerId, tower_name: highestResolved.label, tower_name_es: highestResolved.label, latitude: highestResolved.lat, longitude: highestResolved.lon, height_m: highestResolved.height, height_basis: 'structural_tip', tower_type: 'building_or_freestanding_tower', completed_year: highestResolved.year || 1900, completion_status: 'completed', coordinate_source_id: tallestSource, height_source_id: tallestSource });
    if (!cityTowers.some((link) => link.city_id === cityId && link.tower_id === tallestTowerId)) cityTowers.push({ city_id: cityId, tower_id: tallestTowerId, tallest_eligible: true, iconic_candidate: tallestTowerId === iconicTowerId, association_source_id: tallestSource, disqualification_reason: '', review_status: 'approved' });
    selections.push({ city_id: cityId, mode: 'tallest', tower_id: tallestTowerId, co_tallest: false, selection_reason_en: `${highestResolved.label} is the highest completed eligible Wikidata candidate reviewed for ${seed.nameEn}.`, selection_reason_es: `${highestResolved.label} es el candidato elegible completado más alto revisado en Wikidata para ${seed.nameEs}.`, confidence: tallest[index] ? 'medium' : 'low', selection_source_id: tallestSource, reviewer: 'candidate pipeline review', reviewed_at: REVIEW_DATE });
    if (!tallest[index]) researchLog.push({ issue_id: `tallest-${cityId}`, entity_type: 'city', entity_id: cityId, issue_type: 'candidate_fallback', severity: 'warning', status: 'resolved_with_waiver', decision: 'Iconic landmark used as tallest candidate pending a broader authoritative source audit.', evidence_source_id: iconicSource, owner: 'editorial review', opened_at: REVIEW_DATE, resolved_at: REVIEW_DATE });
  });

  const output = new URL('../data/curated/', import.meta.url);
  await mkdir(output, { recursive: true });
  await mkdir(new URL('../data/snapshots/', import.meta.url), { recursive: true });
  await Promise.all([
    writeFile(new URL('cities.csv', output), csv(cities)),
    writeFile(new URL('airports.csv', output), csv([...airports.values()])),
    writeFile(new URL('city_airports.csv', output), csv(cityAirports)),
    writeFile(new URL('towers.csv', output), csv([...towers.values()])),
    writeFile(new URL('city_towers.csv', output), csv(cityTowers)),
    writeFile(new URL('tower_selections.csv', output), csv(selections)),
    writeFile(new URL('sources.csv', output), csv(sources)),
    writeFile(new URL('research_log.csv', output), csv(researchLog.length ? researchLog : [{ issue_id: '', entity_type: '', entity_id: '', issue_type: '', severity: '', status: '', decision: '', evidence_source_id: '', owner: '', opened_at: '', resolved_at: '' }])),
    writeFile(new URL('../data/snapshots/ourairports.sha256', import.meta.url), `${createHash('sha256').update(airportBytes).digest('hex')}  airports.csv\n`),
  ]);
  console.log(`Wrote ${cities.length} cities, ${airports.size} airports, ${towers.size} towers and ${selections.length} selections.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
