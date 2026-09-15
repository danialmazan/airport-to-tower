import geographicLib from 'geographiclib-geodesic';

export function geodesicDistanceMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const result = geographicLib.Geodesic.WGS84.Inverse(lat1, lon1, lat2, lon2);
  if (!Number.isFinite(result.s12) || result.s12 <= 0) {
    throw new Error('Coordinates must produce a positive finite geodesic distance.');
  }
  return result.s12;
}

export function calculateIndex(distanceMetres: number, baseMetres: number): number {
  if (!Number.isFinite(distanceMetres) || distanceMetres <= 0) {
    throw new Error('Observation distance must be positive and finite.');
  }
  if (!Number.isFinite(baseMetres) || baseMetres <= 0) {
    throw new Error('Index base distance must be positive and finite.');
  }
  return (distanceMetres / baseMetres) * 100;
}

export function formatDistance(distanceKm: number, locale: string): string {
  if (distanceKm > 0 && distanceKm < 0.05) return '<0.1 km';
  return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(distanceKm)} km`;
}

export function sampleGeodesic(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): [number, number][] {
  const inverse = geographicLib.Geodesic.WGS84.Inverse(lat1, lon1, lat2, lon2);
  const segments = Math.min(128, Math.max(16, Math.ceil(inverse.s12 / 5000)));
  const line = geographicLib.Geodesic.WGS84.Line(lat1, lon1, inverse.azi1);
  return Array.from({ length: segments + 1 }, (_, i) => {
    const point = line.Position((inverse.s12 * i) / segments);
    return [point.lon2, point.lat2];
  });
}
