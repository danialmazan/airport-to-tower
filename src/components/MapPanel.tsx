import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { sampleGeodesic } from '../lib/math';
import type { Observation } from '../types';

export default function MapPanel({ observation, description, unavailable }: { observation: Observation; description: string; unavailable: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    setFailed(false);
    const tileUrl = import.meta.env.VITE_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    const map = new maplibregl.Map({
      container: container.current,
      style: import.meta.env.VITE_MAP_STYLE ? import.meta.env.VITE_MAP_STYLE : {
        version: 8,
        sources: {
          basemap: {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'basemap', type: 'raster', source: 'basemap', minzoom: 0, maxzoom: 20 }],
      },
      attributionControl: false,
      cooperativeGestures: true,
      center: [(observation.airport_longitude + observation.tower_longitude) / 2, (observation.airport_latitude + observation.tower_latitude) / 2],
      zoom: 7,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    let tileErrors = 0;
    const failTimer = window.setTimeout(() => setFailed(true), 10000);
    map.on('error', () => { tileErrors += 1; if (tileErrors >= 4) setFailed(true); });
    map.on('load', () => {
      window.clearTimeout(failTimer);
      const coordinates = sampleGeodesic(observation.airport_latitude, observation.airport_longitude, observation.tower_latitude, observation.tower_longitude);
      map.addSource('connection', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } } });
      map.addLayer({ id: 'connection-halo', type: 'line', source: 'connection', paint: { 'line-color': '#fafaf7', 'line-width': 6, 'line-opacity': 0.85 } });
      map.addLayer({ id: 'connection', type: 'line', source: 'connection', paint: { 'line-color': '#fb6107', 'line-width': 3, 'line-dasharray': [2, 1.5] } });
      new maplibregl.Marker({ color: '#145c9e' }).setLngLat([observation.airport_longitude, observation.airport_latitude]).addTo(map);
      new maplibregl.Marker({ color: '#fb6107' }).setLngLat([observation.tower_longitude, observation.tower_latitude]).addTo(map);
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([observation.airport_longitude, observation.airport_latitude]);
      bounds.extend([observation.tower_longitude, observation.tower_latitude]);
      map.resize();
      map.fitBounds(bounds, { padding: 55, maxZoom: 11, duration: 0 });
    });
    map.once('idle', () => { window.clearTimeout(failTimer); setFailed(false); });
    return () => { window.clearTimeout(failTimer); map.remove(); };
  }, [observation]);

  return (
    <figure className="detail-map">
      <div ref={container} className="map-canvas" aria-hidden="true" />
      {failed && (
        <div className="map-fallback" aria-hidden="true">
          <svg viewBox="0 0 640 260" preserveAspectRatio="none">
            <defs>
              <pattern id="fallback-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeOpacity=".12" />
              </pattern>
            </defs>
            <rect width="640" height="260" fill="url(#fallback-grid)" />
            <path d="M 72 186 Q 320 42 568 74" className="fallback-route-halo" />
            <path d="M 72 186 Q 320 42 568 74" className="fallback-route" />
            <circle cx="72" cy="186" r="10" className="fallback-airport" />
            <circle cx="568" cy="74" r="10" className="fallback-tower" />
            <text x="72" y="216" textAnchor="middle">{observation.iata || observation.icao || 'Airport'}</text>
            <text x="568" y="52" textAnchor="middle">{observation.tower_name}</text>
          </svg>
          <span>{unavailable}</span>
        </div>
      )}
      <figcaption>{description}</figcaption>
    </figure>
  );
}
