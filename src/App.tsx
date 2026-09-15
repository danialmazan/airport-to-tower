import { useEffect, useMemo, useRef, useState } from 'react';
import type { Language, Metadata, Mode, Observation, SourceRecord } from './types';
import { calculateIndex, formatDistance } from './lib/math';
import { t } from './i18n/copy';
import { DetailPanel } from './components/DetailPanel';

type SortKey = 'distance' | 'city' | 'airport' | 'tower' | 'index';
interface Filters { query: string; country: string; continent: string; service: string; min: string; max: string; }
const emptyFilters: Filters = { query: '', country: '', continent: '', service: '', min: '', max: '' };

const getInitialLanguage = (): Language => {
  const value = new URLSearchParams(location.search).get('lang') ?? localStorage.getItem('airport-tower-language');
  return value === 'es' || (!value && navigator.language.toLowerCase().startsWith('es')) ? 'es' : 'en';
};
const getInitialMode = (): Mode => new URLSearchParams(location.search).get('mode') === 'iconic' ? 'iconic' : 'tallest';

export default function App() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [mode, setMode] = useState<Mode>(getInitialMode);
  const params = useMemo(() => new URLSearchParams(location.search), []);
  const [baseId, setBaseId] = useState(params.get('base') ?? '');
  const [selectedId, setSelectedId] = useState(params.get('selected') ?? '');
  const [filters, setFilters] = useState<Filters>({ query: params.get('q') ?? '', country: params.get('country') ?? '', continent: params.get('continent') ?? '', service: params.get('service') ?? '', min: params.get('min') ?? '', max: params.get('max') ?? '' });
  const [sort, setSort] = useState<SortKey>((params.get('sort') as SortKey) || 'distance');
  const [direction, setDirection] = useState<'asc' | 'desc'>(params.get('dir') === 'desc' ? 'desc' : 'asc');
  const [baseInput, setBaseInput] = useState('');
  const [notice, setNotice] = useState('');
  const [loadError, setLoadError] = useState(false);
  const resultsRef = useRef<HTMLParagraphElement>(null);
  const copy = t(language);
  const locale = language === 'es' ? 'es-ES' : 'en-GB';

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/observations.json`).then((response) => { if (!response.ok) throw new Error(); return response.json(); }),
      fetch(`${import.meta.env.BASE_URL}data/metadata.json`).then((response) => response.json()),
      fetch(`${import.meta.env.BASE_URL}data/sources.json`).then((response) => response.json()),
    ]).then(([items, meta, sourceItems]) => { setObservations(items); setMetadata(meta); setSources(sourceItems); }).catch(() => setLoadError(true));
  }, []);

  const labelFor = (item: Observation) => `${language === 'es' ? item.city_name_es : item.city_name_en} — ${item.iata || item.icao} — ${language === 'es' ? item.tower_name_es : item.tower_name}`;
  const modeObservations = useMemo(() => observations.filter((item) => item.mode === mode), [observations, mode]);
  const base = modeObservations.find((item) => item.observation_id === baseId);
  const selected = modeObservations.find((item) => item.observation_id === selectedId);

  useEffect(() => { if (base) setBaseInput(labelFor(base)); else if (!baseId) setBaseInput(''); }, [base, baseId, language]);
  useEffect(() => {
    if (!observations.length) return;
    if (baseId && !base) { setBaseId(''); setBaseInput(''); }
    if (selectedId && !selected) setSelectedId('');
  }, [observations, baseId, base, selectedId, selected]);

  useEffect(() => {
    const restoreFromUrl = () => {
      const next = new URLSearchParams(location.search);
      setLanguage(next.get('lang') === 'es' ? 'es' : 'en');
      setMode(next.get('mode') === 'iconic' ? 'iconic' : 'tallest');
      setBaseId(next.get('base') ?? '');
      setSelectedId(next.get('selected') ?? '');
      setFilters({ query: next.get('q') ?? '', country: next.get('country') ?? '', continent: next.get('continent') ?? '', service: next.get('service') ?? '', min: next.get('min') ?? '', max: next.get('max') ?? '' });
      const nextSort = next.get('sort');
      setSort(nextSort === 'city' || nextSort === 'airport' || nextSort === 'tower' || nextSort === 'index' ? nextSort : 'distance');
      setDirection(next.get('dir') === 'desc' ? 'desc' : 'asc');
    };
    addEventListener('popstate', restoreFromUrl);
    return () => removeEventListener('popstate', restoreFromUrl);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = copy.title;
    localStorage.setItem('airport-tower-language', language);
    const next = new URLSearchParams();
    if (language !== 'en') next.set('lang', language);
    if (mode !== 'tallest') next.set('mode', mode);
    if (baseId) next.set('base', baseId);
    if (selectedId) next.set('selected', selectedId);
    if (filters.query) next.set('q', filters.query);
    if (filters.country) next.set('country', filters.country);
    if (filters.continent) next.set('continent', filters.continent);
    if (filters.service) next.set('service', filters.service);
    if (filters.min) next.set('min', filters.min);
    if (filters.max) next.set('max', filters.max);
    if (sort !== 'distance') next.set('sort', sort);
    if (direction !== 'asc') next.set('dir', direction);
    history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}${location.hash}`);
  }, [language, mode, baseId, selectedId, filters, sort, direction, copy.title]);

  const filtered = useMemo(() => modeObservations.filter((item) => {
    const query = filters.query.trim().toLocaleLowerCase(locale);
    const haystack = [item.city_name_en, item.city_name_es, item.airport_name, item.iata, item.icao, item.tower_name, item.tower_name_es].join(' ').toLocaleLowerCase(locale);
    return (!query || haystack.includes(query)) && (!filters.country || item.country_code === filters.country) && (!filters.continent || item.continent === filters.continent) && (!filters.service || item.service_pattern === filters.service) && (!filters.min || item.distance_km >= Number(filters.min)) && (!filters.max || item.distance_km <= Number(filters.max));
  }), [modeObservations, filters, locale]);

  const rankById = useMemo(() => {
    const ranked = [...filtered].sort((a, b) => a.distance_m - b.distance_m || a.observation_id.localeCompare(b.observation_id));
    const result = new Map<string, number>();
    let rank = 1;
    ranked.forEach((item, index) => { if (index && item.distance_m !== ranked[index - 1].distance_m) rank = index + 1; result.set(item.observation_id, rank); });
    return result;
  }, [filtered]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let value = 0;
    if (sort === 'city') value = (language === 'es' ? a.city_name_es : a.city_name_en).localeCompare(language === 'es' ? b.city_name_es : b.city_name_en, locale);
    else if (sort === 'airport') value = a.airport_name.localeCompare(b.airport_name, locale);
    else if (sort === 'tower') value = a.tower_name.localeCompare(b.tower_name, locale);
    else value = a.distance_m - b.distance_m;
    return (direction === 'asc' ? value : -value) || a.observation_id.localeCompare(b.observation_id);
  }), [filtered, sort, direction, language, locale]);

  const countries = useMemo(() => [...new Map(modeObservations.map((item) => [item.country_code, language === 'es' ? item.country_name_es : item.country_name_en])).entries()].sort((a, b) => a[1].localeCompare(b[1], locale)), [modeObservations, language, locale]);
  const continentLabel = (value: string) => language === 'es' ? ({ Asia: 'Asia', Europe: 'Europa', Africa: 'África', 'North America': 'Norteamérica', 'South America': 'Sudamérica', Oceania: 'Oceanía' }[value] ?? value) : value;
  const continents = useMemo(() => [...new Set(modeObservations.map((item) => item.continent))].sort((a, b) => continentLabel(a).localeCompare(continentLabel(b), locale)), [modeObservations, language, locale]);
  const resultCities = new Set(filtered.map((item) => item.city_id)).size;

  const pushExplicitState = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(location.search);
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    history.pushState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}${location.hash}`);
  };

  const updateMode = (next: Mode) => {
    if (next === mode) return;
    pushExplicitState({ mode: next === 'tallest' ? null : next, base: null, selected: null });
    setMode(next); setSelectedId('');
    if (baseId) { setBaseId(''); setBaseInput(''); setNotice(copy.baseCleared); }
  };
  const updateSort = (next: SortKey) => { if (sort === next) setDirection((value) => value === 'asc' ? 'desc' : 'asc'); else { setSort(next); setDirection('asc'); } };
  const chooseBase = (value: string) => {
    setBaseInput(value);
    const item = modeObservations.find((candidate) => labelFor(candidate) === value);
    if (item) { pushExplicitState({ base: item.observation_id }); setBaseId(item.observation_id); setNotice(`${copy.selectedBase}: ${value}`); }
  };
  const selectObservation = (id: string) => { pushExplicitState({ selected: id }); setSelectedId(id); };
  const closeObservation = () => { pushExplicitState({ selected: null }); setSelectedId(''); };
  const clearBase = () => { pushExplicitState({ base: null }); setBaseId(''); setBaseInput(''); };
  const filter = (key: keyof Filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const sortButton = (key: SortKey, label: string) => <button onClick={() => updateSort(key)}>{label}<span aria-hidden="true">{sort === key ? direction === 'asc' ? ' ↑' : ' ↓' : ' ↕'}</span></button>;

  if (loadError) return <main className="status-page"><h1>{copy.error}</h1></main>;
  if (!metadata) return <main className="status-page"><p>{copy.loading}</p></main>;

  return <>
    <a className="skip-link" href="#ranking">{copy.skip}</a>
    <header className="site-header">
      <div className="route-motif" aria-hidden="true"><i /><b /><em /></div>
      <nav aria-label="Project navigation"><a className="wordmark" href="#top">DAT / 001</a><div><a href="#methodology">{copy.methodology}</a><a href={`${import.meta.env.BASE_URL}data/observations.csv`}>{copy.data}</a><button className="language-button" onClick={() => setLanguage((value) => value === 'en' ? 'es' : 'en')} aria-label={language === 'en' ? 'Cambiar a español' : 'Switch to English'}>{language === 'en' ? 'ES' : 'EN'}</button></div></nav>
      <div className="header-copy" id="top"><span className="eyebrow">{copy.edition}</span><h1>{copy.title}</h1><p>{copy.dek}</p><div className="release-line"><span>{metadata.city_count} {copy.cities}</span><span>{metadata.observation_count} {copy.observations}</span><span>{copy.reviewed} {metadata.review_cutoff}</span></div><p className="preview-note"><strong>{copy.previewLabel}</strong> {copy.previewNote}</p></div>
    </header>

    <main>
      <section className="workspace" aria-label="Ranking controls">
        <div className="mode-row"><div className="segmented" role="group" aria-label="Tower mode"><button className={mode === 'tallest' ? 'active' : ''} aria-pressed={mode === 'tallest'} onClick={() => updateMode('tallest')}>{copy.tallest}</button><button className={mode === 'iconic' ? 'active' : ''} aria-pressed={mode === 'iconic'} onClick={() => updateMode('iconic')}>{copy.iconic}</button></div><p>{mode === 'tallest' ? copy.tallestDefinition : copy.iconicDefinition}</p></div>

        <div className="index-control"><label htmlFor="base-search"><span>{copy.indexBase}</span><input id="base-search" list="base-options" value={baseInput} onChange={(event) => chooseBase(event.target.value)} placeholder={copy.indexPlaceholder} autoComplete="off" /></label><datalist id="base-options">{modeObservations.map((item) => <option key={item.observation_id} value={labelFor(item)} />)}</datalist>{base && <button onClick={clearBase}>{copy.clearBase}</button>}<p>{copy.baseHelp}</p></div>

        <div className="filters">
          <label className="search-field"><span>{copy.search}</span><input value={filters.query} onChange={(event) => filter('query', event.target.value)} placeholder={copy.searchPlaceholder} /></label>
          <label><span>{copy.country}</span><select value={filters.country} onChange={(event) => filter('country', event.target.value)}><option value="">{copy.all}</option>{countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
          <label><span>{copy.continent}</span><select value={filters.continent} onChange={(event) => filter('continent', event.target.value)}><option value="">{copy.all}</option>{continents.map((item) => <option key={item} value={item}>{continentLabel(item)}</option>)}</select></label>
          <label><span>{copy.service}</span><select value={filters.service} onChange={(event) => filter('service', event.target.value)}><option value="">{copy.all}</option><option value="year_round">{copy.yearRound}</option><option value="seasonal">{copy.seasonal}</option></select></label>
          <label className="range-field"><span>{copy.min}</span><input type="number" min="0" inputMode="decimal" value={filters.min} onChange={(event) => filter('min', event.target.value)} /></label>
          <label className="range-field"><span>{copy.max}</span><input type="number" min="0" inputMode="decimal" value={filters.max} onChange={(event) => filter('max', event.target.value)} /></label>
        </div>
        <div className="results-line"><p ref={resultsRef} aria-live="polite">{copy.showing} <strong>{sorted.length}</strong> {copy.observations} · <strong>{resultCities}</strong> {copy.cities}</p><button onClick={() => setFilters(emptyFilters)}>{copy.reset}</button></div>
        <p className="sr-only" aria-live="polite">{notice}</p>
      </section>

      <section id="ranking" className={`ranking-layout ${selected ? 'with-detail' : ''}`}>
        <div className="ranking-pane">
          <div className="table-wrap">
            <table><caption className="sr-only">{copy.title}</caption><thead><tr><th className="numeric">{copy.rank}</th><th aria-sort={sort === 'city' ? `${direction}ending` : 'none'}>{sortButton('city', copy.city)}</th><th aria-sort={sort === 'airport' ? `${direction}ending` : 'none'}>{sortButton('airport', copy.airport)}</th><th aria-sort={sort === 'tower' ? `${direction}ending` : 'none'}>{sortButton('tower', copy.tower)}</th><th className="numeric" aria-sort={sort === 'distance' ? `${direction}ending` : 'none'}>{sortButton('distance', copy.distance)}</th>{base && <th className="numeric" aria-sort={sort === 'index' ? `${direction}ending` : 'none'}>{sortButton('index', copy.index)}</th>}</tr></thead>
            <tbody>{sorted.map((item) => <tr key={item.observation_id} className={`${selectedId === item.observation_id ? 'selected' : ''} ${baseId === item.observation_id ? 'base-row' : ''}`} onClick={() => selectObservation(item.observation_id)}><td className="numeric rank-cell">{rankById.get(item.observation_id)}</td><th scope="row"><button className="row-button"><strong>{language === 'es' ? item.city_name_es : item.city_name_en}</strong><span>{language === 'es' ? item.country_name_es : item.country_name_en}</span></button></th><td><strong>{item.iata || item.icao}</strong><span>{item.airport_name}</span></td><td><strong>{language === 'es' ? item.tower_name_es : item.tower_name}</strong><span>{item.co_tallest ? copy.coTallest : `${item.height_m.toLocaleString(locale)} m`}</span></td><td className="numeric distance-cell">{formatDistance(item.distance_km, locale)}</td>{base && <td className="numeric index-cell">{calculateIndex(item.distance_m, base.distance_m).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>}</tr>)}</tbody></table>
          </div>
          <ol className="mobile-ranking">{sorted.map((item) => <li key={item.observation_id} className={selectedId === item.observation_id ? 'selected' : ''}><button onClick={() => selectObservation(item.observation_id)}><span className="mobile-rank">{rankById.get(item.observation_id)}</span><span className="mobile-main"><strong>{language === 'es' ? item.city_name_es : item.city_name_en}</strong><small>{item.iata || item.icao} · {language === 'es' ? item.tower_name_es : item.tower_name}</small></span><span className="mobile-value"><strong>{formatDistance(item.distance_km, locale)}</strong>{base && <small>{calculateIndex(item.distance_m, base.distance_m).toFixed(1)}</small>}</span></button></li>)}</ol>
          {!sorted.length && <p className="empty-state">{copy.noResults}</p>}
        </div>
        {selected && <DetailPanel observation={selected} base={base} sources={sources} language={language} onClose={closeObservation} />}
      </section>

      <section id="methodology" className="methodology-section"><span className="eyebrow">01 — {copy.methodology}</span><h2>{copy.methodologyTitle}</h2><div className="method-grid"><article><span>01</span><h3>{copy.scopeTitle}</h3><p>{copy.scopeText}</p></article><article><span>02</span><h3>{copy.airportTitle}</h3><p>{copy.airportText}</p></article><article><span>03</span><h3>{copy.towerTitle}</h3><p>{copy.towerText}</p></article><article><span>04</span><h3>{copy.calculationTitle}</h3><p>{copy.calculationText}</p></article><article><span>05</span><h3>{copy.limitationsTitle}</h3><p>{copy.limitationsText}</p></article></div></section>
    </main>
    <footer><span>Airport to Tower Distance Global Index</span><span>WGS84 · {metadata.release_id}</span><a href="https://github.com/danialmazan/airport-to-tower" target="_blank" rel="noreferrer">{copy.openSource} ↗</a></footer>
  </>;
}
