import { describe, expect, it } from 'vitest';
import { calculateIndex, formatDistance, geodesicDistanceMetres, sampleGeodesic } from '../../src/lib/math';

describe('index calculation', () => {
  it.each([[5_000, 50], [10_000, 100], [20_000, 200]])('indexes %i metres to %i', (distance, expected) => expect(calculateIndex(distance, 10_000)).toBe(expected));
  it('uses unrounded fractional values', () => expect(calculateIndex(1_234.5, 9_876.5)).toBeCloseTo(12.499367, 5));
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid bases', (base) => expect(() => calculateIndex(10, base)).toThrow());
});

describe('WGS84 distance', () => {
  it('matches a published GeographicLib-style equatorial fixture', () => expect(geodesicDistanceMetres(0, 0, 0, 1)).toBeCloseTo(111_319.4908, 3));
  it('handles the antimeridian', () => expect(geodesicDistanceMetres(10, 179.5, 10, -179.5)).toBeGreaterThan(100_000));
  it('rejects identical points', () => expect(() => geodesicDistanceMetres(1, 2, 1, 2)).toThrow());
  it('samples the full route endpoints', () => { const points = sampleGeodesic(40, -3, 41, 2); expect(points.length).toBeGreaterThanOrEqual(17); expect(points[0][0]).toBeCloseTo(-3, 5); expect(points.at(-1)![1]).toBeCloseTo(41, 5); });
});

describe('display rounding', () => {
  it('shows short positive distances without a false zero', () => expect(formatDistance(0.049, 'en-GB')).toBe('<0.1 km'));
  it('shows one decimal kilometre', () => expect(formatDistance(10.24, 'en-GB')).toBe('10.2 km'));
});
