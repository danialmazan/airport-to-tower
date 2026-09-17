import { lazy, Suspense } from 'react';
import type { Language, Observation, SourceRecord } from '../types';
import { calculateIndex, formatDistance } from '../lib/math';
import { t } from '../i18n/copy';

const MapPanel = lazy(() => import('./MapPanel'));

export function DetailPanel({ observation, base, sources, language, onClose }: { observation: Observation; base?: Observation; sources: SourceRecord[]; language: Language; onClose: () => void }) {
  const copy = t(language);
  const locale = language === 'es' ? 'es-ES' : 'en-GB';
  const sourceById = new Map(sources.map((source) => [source.source_id, source]));
  return <aside className="detail-panel" aria-labelledby="detail-title">
    <div className="detail-heading"><div><span className="eyebrow">{copy.details}</span><h2 id="detail-title">{language === 'es' ? observation.city_name_es : observation.city_name_en}</h2></div><button className="icon-button" onClick={onClose} aria-label={copy.close}>×</button></div>
    <div className="detail-route"><span>{observation.iata || observation.icao}</span><i aria-hidden="true" /><span>{language === 'es' ? observation.tower_name_es : observation.tower_name}</span></div>
    <dl className="detail-stats">
      <div><dt>{copy.distance}</dt><dd>{formatDistance(observation.distance_km, locale)}</dd></div>
      {base && <div><dt>{copy.index}</dt><dd>{calculateIndex(observation.distance_m, base.distance_m).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</dd></div>}
      <div><dt>{copy.height}</dt><dd>{observation.height_m.toLocaleString(locale)} m</dd></div>
      <div><dt>{copy.completed}</dt><dd>{observation.completed_year}</dd></div>
      <div><dt>{copy.passengers}</dt><dd>{observation.annual_passengers_m == null ? copy.passengersUnavailable : `${observation.annual_passengers_m.toLocaleString(locale, { maximumFractionDigits: 1 })} M${observation.passenger_year ? ` (${observation.passenger_year})` : ''}`}</dd></div>
    </dl>
    <Suspense fallback={<div className="map-skeleton" aria-hidden="true" />}><MapPanel observation={observation} description={copy.mapDescription} unavailable={copy.mapUnavailable} /></Suspense>
    <div className="detail-copy"><h3>{copy.rationale}</h3><p>{language === 'es' ? observation.selection_reason_es : observation.selection_reason_en}</p></div>
    <div className="detail-grid"><div><span>{copy.confidence}</span><strong>{copy[observation.confidence]}</strong></div><div><span>{copy.coordinates}</span><strong>{observation.tower_latitude.toFixed(5)}, {observation.tower_longitude.toFixed(5)}</strong></div></div>
    <div className="source-list"><h3>{copy.sources}</h3>{observation.source_ids.map((id) => sourceById.get(id)).filter(Boolean).map((source) => <a key={source!.source_id} href={source!.url} target="_blank" rel="noreferrer">{source!.title}<span aria-hidden="true">↗</span></a>)}</div>
  </aside>;
}
