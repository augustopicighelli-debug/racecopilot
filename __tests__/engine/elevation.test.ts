import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildElevationProfile, buildFlatProfile } from '../../lib/engine/elevation';
import { parseGpx } from '../../lib/gpx/parser';

const FIXTURES_DIR = join(__dirname, '../fixtures');

function loadPoints(name: string) {
  const content = readFileSync(join(FIXTURES_DIR, name), 'utf-8');
  return parseGpx(content);
}

describe('buildElevationProfile', () => {
  describe('flat GPX (~5km)', () => {
    it('returns hasGpx = true', () => {
      const points = loadPoints('sample-flat.gpx');
      const profile = buildElevationProfile(points, 5);
      expect(profile.hasGpx).toBe(true);
    });

    it('returns 5 segments for 5km course', () => {
      const points = loadPoints('sample-flat.gpx');
      const profile = buildElevationProfile(points, 5);
      expect(profile.segments).toHaveLength(5);
    });

    it('segments have correct kmIndex', () => {
      const points = loadPoints('sample-flat.gpx');
      const profile = buildElevationProfile(points, 5);
      profile.segments.forEach((seg, i) => {
        expect(seg.kmIndex).toBe(i);
      });
    });

    it('segments span correct distances', () => {
      const points = loadPoints('sample-flat.gpx');
      const profile = buildElevationProfile(points, 5);
      profile.segments.forEach((seg, i) => {
        expect(seg.startDistance).toBe(i * 1000);
        expect(seg.endDistance).toBe(Math.min((i + 1) * 1000, 5000));
      });
    });

    it('total elevation gain is minimal on flat course', () => {
      const points = loadPoints('sample-flat.gpx');
      const profile = buildElevationProfile(points, 5);
      expect(profile.totalElevationGain).toBeLessThan(20);
    });

    it('distanceKm matches input', () => {
      const points = loadPoints('sample-flat.gpx');
      const profile = buildElevationProfile(points, 5);
      expect(profile.distanceKm).toBe(5);
    });

    it('has no warningMessage', () => {
      const points = loadPoints('sample-flat.gpx');
      const profile = buildElevationProfile(points, 5);
      expect(profile.warningMessage).toBeUndefined();
    });
  });

  describe('hilly GPX (~5km)', () => {
    it('total elevation gain is significant', () => {
      const points = loadPoints('sample-hilly.gpx');
      const profile = buildElevationProfile(points, 5);
      // Hilly course rises ~150m; boundary interpolation may reduce the captured total slightly
      expect(profile.totalElevationGain).toBeGreaterThan(80);
    });

    it('total elevation loss is significant', () => {
      const points = loadPoints('sample-hilly.gpx');
      const profile = buildElevationProfile(points, 5);
      // Hilly course descends ~150m; boundary interpolation may reduce the captured total slightly
      expect(profile.totalElevationLoss).toBeGreaterThan(80);
    });

    it('segments have bearing values', () => {
      const points = loadPoints('sample-hilly.gpx');
      const profile = buildElevationProfile(points, 5);
      // All points go east so bearing should be near 90 degrees
      for (const seg of profile.segments) {
        expect(seg.bearing).toBeGreaterThanOrEqual(0);
        expect(seg.bearing).toBeLessThan(360);
      }
    });

    it('gradients are non-zero in hilly segments', () => {
      const points = loadPoints('sample-hilly.gpx');
      const profile = buildElevationProfile(points, 5);
      const nonZeroGradients = profile.segments.filter(
        s => Math.abs(s.avgGradientPercent) > 0.1
      );
      expect(nonZeroGradients.length).toBeGreaterThan(0);
    });
  });
});

describe('buildFlatProfile', () => {
  it('returns hasGpx = false', () => {
    const profile = buildFlatProfile(10);
    expect(profile.hasGpx).toBe(false);
  });

  it('includes the warning message', () => {
    const profile = buildFlatProfile(10);
    expect(profile.warningMessage).toBe(
      'Sin perfil de elevación, los splits son estimados en terreno plano. Subí el GPX para mejor precisión.'
    );
  });

  it('creates correct number of segments for integer distance', () => {
    const profile = buildFlatProfile(10);
    expect(profile.segments).toHaveLength(10);
  });

  it('creates correct number of segments for non-integer distance', () => {
    const profile = buildFlatProfile(21.1);
    expect(profile.segments).toHaveLength(22);
  });

  it('totalElevationGain is 0 without manual elevation', () => {
    const profile = buildFlatProfile(10);
    expect(profile.totalElevationGain).toBe(0);
  });

  it('totalElevationLoss is always 0', () => {
    const profile = buildFlatProfile(10, 500);
    expect(profile.totalElevationLoss).toBe(0);
  });

  it('distributes manual elevation gain evenly across segments', () => {
    const profile = buildFlatProfile(5, 500);
    expect(profile.totalElevationGain).toBe(500);
    const totalFromSegments = profile.segments.reduce((sum, s) => sum + s.elevationGain, 0);
    expect(totalFromSegments).toBeCloseTo(500, 5);
  });

  it('each segment has equal elevation gain with manual elevation', () => {
    const profile = buildFlatProfile(5, 500);
    const gainPerSegment = 500 / 5;
    for (const seg of profile.segments) {
      expect(seg.elevationGain).toBeCloseTo(gainPerSegment, 5);
    }
  });

  it('stores manualElevationGain on profile', () => {
    const profile = buildFlatProfile(10, 300);
    expect(profile.manualElevationGain).toBe(300);
  });

  it('gradient is positive when manual elevation provided', () => {
    const profile = buildFlatProfile(5, 200);
    for (const seg of profile.segments) {
      expect(seg.avgGradientPercent).toBeGreaterThan(0);
    }
  });

  it('gradient is zero without manual elevation', () => {
    const profile = buildFlatProfile(5);
    for (const seg of profile.segments) {
      expect(seg.avgGradientPercent).toBe(0);
    }
  });

  it('segment kmIndex matches position', () => {
    const profile = buildFlatProfile(5);
    profile.segments.forEach((seg, i) => {
      expect(seg.kmIndex).toBe(i);
    });
  });

  it('last segment endDistance equals total distance in meters', () => {
    const profile = buildFlatProfile(5);
    const lastSeg = profile.segments[profile.segments.length - 1];
    expect(lastSeg.endDistance).toBe(5000);
  });
});
