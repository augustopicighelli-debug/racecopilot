import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseGpx } from '../../lib/gpx/parser';

const FIXTURES_DIR = join(__dirname, '../fixtures');

function loadFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), 'utf-8');
}

describe('parseGpx', () => {
  describe('sample-flat.gpx', () => {
    it('returns 5 points', () => {
      const content = loadFixture('sample-flat.gpx');
      const points = parseGpx(content);
      expect(points).toHaveLength(5);
    });

    it('first point has distanceFromStart = 0', () => {
      const content = loadFixture('sample-flat.gpx');
      const points = parseGpx(content);
      expect(points[0].distanceFromStart).toBe(0);
    });

    it('total distance is approximately 5km', () => {
      const content = loadFixture('sample-flat.gpx');
      const points = parseGpx(content);
      const totalDistance = points[points.length - 1].distanceFromStart;
      expect(totalDistance).toBeGreaterThan(4500);
      expect(totalDistance).toBeLessThan(5500);
    });

    it('each point has lat, lon, elevation, distanceFromStart', () => {
      const content = loadFixture('sample-flat.gpx');
      const points = parseGpx(content);
      for (const pt of points) {
        expect(typeof pt.lat).toBe('number');
        expect(typeof pt.lon).toBe('number');
        expect(typeof pt.elevation).toBe('number');
        expect(typeof pt.distanceFromStart).toBe('number');
      }
    });

    it('elevation is constant around 100m', () => {
      const content = loadFixture('sample-flat.gpx');
      const points = parseGpx(content);
      const elevations = points.map(p => p.elevation);
      const maxEl = Math.max(...elevations);
      const minEl = Math.min(...elevations);
      expect(maxEl - minEl).toBeLessThan(5);
    });

    it('distanceFromStart is strictly increasing', () => {
      const content = loadFixture('sample-flat.gpx');
      const points = parseGpx(content);
      for (let i = 1; i < points.length; i++) {
        expect(points[i].distanceFromStart).toBeGreaterThan(points[i - 1].distanceFromStart);
      }
    });
  });

  describe('sample-hilly.gpx', () => {
    it('returns 10 points', () => {
      const content = loadFixture('sample-hilly.gpx');
      const points = parseGpx(content);
      expect(points).toHaveLength(10);
    });

    it('elevation range is greater than 50m', () => {
      const content = loadFixture('sample-hilly.gpx');
      const points = parseGpx(content);
      const elevations = points.map(p => p.elevation);
      const maxEl = Math.max(...elevations);
      const minEl = Math.min(...elevations);
      expect(maxEl - minEl).toBeGreaterThan(50);
    });

    it('max elevation is around 250m', () => {
      const content = loadFixture('sample-hilly.gpx');
      const points = parseGpx(content);
      const maxEl = Math.max(...points.map(p => p.elevation));
      expect(maxEl).toBeGreaterThanOrEqual(250);
    });

    it('total distance is approximately 5km', () => {
      const content = loadFixture('sample-hilly.gpx');
      const points = parseGpx(content);
      const totalDistance = points[points.length - 1].distanceFromStart;
      expect(totalDistance).toBeGreaterThan(4500);
      expect(totalDistance).toBeLessThan(5500);
    });

    it('first point has distanceFromStart = 0', () => {
      const content = loadFixture('sample-hilly.gpx');
      const points = parseGpx(content);
      expect(points[0].distanceFromStart).toBe(0);
    });
  });

  describe('error handling', () => {
    it('throws when GPX has no track', () => {
      const gpx = `<?xml version="1.0"?><gpx version="1.1"></gpx>`;
      expect(() => parseGpx(gpx)).toThrow('No track found in GPX file');
    });

    it('throws when track has no track points', () => {
      const gpx = `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg></trkseg></trk></gpx>`;
      expect(() => parseGpx(gpx)).toThrow('No track points found');
    });
  });
});
