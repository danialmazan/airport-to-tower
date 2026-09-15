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
    const map = new maplibregl.Map({
      container: container.current,
      style: import.meta.env.VITE_MAP_STYLE ?? 'https://tiles.openfreemap.org/styles/positron',
      attributionControl: false,
      cooperativeGestures: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.on('error', () => setFailed(true));
    map.on('load', () => {
      const coordinates = sampleGeodesic(observation.airport_latitude, observation.airport_longitude, observation.tower_latitude, observation.tower_longitude);
      map.addSource('connection', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } } });
      map.addLayer({ id: 'connection-halo', type: 'line', source: 'connection', paint: { 'line-color': '#fafaf7', 'line-width': 6, 'line-opacity': 0.85 } });
      map.addLayer({ id: 'connection', type: 'line', source: 'connection', paint: { 'line-color': '#fb6107', 'line-width': 3, 'line-dasharray': [2, 1.5] } });
      new maplibregl.Marker({ color: '#145c9e' }).setLngLat([observation.airport_longitude, observation.airport_latitude]).addTo(map);
      new maplibregl.Marker({ color: '#fb6107' }).setLngLat([observation.tower_longitude, observation.tower_latitude]).addTo(map);
      map.fitBounds(new maplibregl.LngLatBounds([observation.airport_longitude, observation.airport_latitude], [observation.tower_longitude, observation.tower_latitude]), { padding: 55, maxZoom: 11, duration: 0 });
    });
    return () => map.remove();
  }, [observation]);

  return <figure className="detail-map"><div ref={container} className="map-canvas" aria-hidden="true" />{failed && <span className="map-fallback">{unavailable}</span>}<figcaption>{description}</figcaption></figure>;
}
