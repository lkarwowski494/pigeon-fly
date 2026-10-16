/**
 * Tests for Flight Telemetry, GPS Loggers & BTS Interpolation (src/domain/telemetry.ts)
 */

import {
  analyzeFlightTrack,
  parseGpsLoggerCsv,
  interpolateBtsTrack,
  FlightTrack,
} from '../src/domain/telemetry';

describe('Telemetry Engine — Track Analysis', () => {
  test('handles empty or single-point flight track gracefully', () => {
    const emptyAnalysis = analyzeFlightTrack({
      id: 't-0',
      pigeonId: 'p-1',
      ringNumber: 'PL-0284-23-1402',
      points: [],
    });
    expect(emptyAnalysis.pointCount).toBe(0);
    expect(emptyAnalysis.routeEfficiencyRatio).toBe(1.0);

    const singleAnalysis = analyzeFlightTrack({
      id: 't-1',
      pigeonId: 'p-1',
      ringNumber: 'PL-0284-23-1402',
      points: [
        {
          latitude: 52.2,
          longitude: 21.0,
          timestampIso: '2026-06-01T07:00:00Z',
          speedKmh: 75.0,
          altitudeMeters: 180,
        },
      ],
    });
    expect(singleAnalysis.pointCount).toBe(1);
    expect(singleAnalysis.maxSpeedKmh).toBe(75.0);
    expect(singleAnalysis.maxAltitudeMeters).toBe(180);
  });

  test('analyzes multi-point trajectory correctly with efficiency ratio', () => {
    // Berlin (52.5200, 13.4050) -> Frankfurt/Oder (52.3414, 14.5516) -> Poznań (52.4064, 16.9252)
    const track: FlightTrack = {
      id: 't-race-1',
      pigeonId: 'p-1',
      ringNumber: 'PL-0284-23-1402',
      points: [
        {
          latitude: 52.52,
          longitude: 13.405,
          altitudeMeters: 120,
          speedKmh: 68.0,
          timestampIso: '2026-06-01T06:00:00Z',
        },
        {
          latitude: 52.3414,
          longitude: 14.5516,
          altitudeMeters: 260,
          speedKmh: 82.5,
          timestampIso: '2026-06-01T07:15:00Z',
        },
        {
          latitude: 52.4064,
          longitude: 16.9252,
          altitudeMeters: 150,
          speedKmh: 74.0,
          timestampIso: '2026-06-01T09:00:00Z',
        },
      ],
    };

    const analysis = analyzeFlightTrack(track);

    expect(analysis.pointCount).toBe(3);
    expect(analysis.totalDurationSeconds).toBe(10800); // 3 hours
    expect(analysis.maxSpeedKmh).toBe(82.5);
    expect(analysis.maxAltitudeMeters).toBe(260);
    expect(analysis.avgAltitudeMeters).toBeGreaterThan(150);
    expect(analysis.actualTrackDistanceMeters).toBeGreaterThan(200000);
    expect(analysis.geodesicDistanceMeters).toBeGreaterThan(200000);
    expect(analysis.routeEfficiencyRatio).toBeGreaterThan(0.9); // Mostly direct corridor
    expect(analysis.routeEfficiencyRatio).toBeLessThanOrEqual(1.0);
  });
});

describe('Telemetry Engine — CSV Parser', () => {
  test('parses standard GPS logger CSV with latitude, longitude, altitude, time, and speed', () => {
    const csvData = `
latitude,longitude,altitude,timestamp,speed
52.5200,13.4050,110,2026-06-01T06:00:00Z,65.2
52.3414,14.5516,210,2026-06-01T07:15:00Z,78.9
52.4064,16.9252,140,2026-06-01T09:00:00Z,71.0
    `.trim();

    const points = parseGpsLoggerCsv(csvData);
    expect(points.length).toBe(3);
    expect(points[0].latitude).toBe(52.52);
    expect(points[0].longitude).toBe(13.405);
    expect(points[0].altitudeMeters).toBe(110);
    expect(points[1].speedKmh).toBe(78.9);
  });

  test('returns empty array for invalid or empty CSV', () => {
    expect(parseGpsLoggerCsv('')).toEqual([]);
    expect(parseGpsLoggerCsv('invalid,header\n1,2')).toEqual([]);
  });
});

describe('Telemetry Engine — BTS Interpolation', () => {
  test('interpolates GPS coordinates from cell tower database', () => {
    const towerMap = new Map([
      ['BTS-PL-01', { latitude: 52.23, longitude: 21.01 }],
      ['BTS-PL-02', { latitude: 52.41, longitude: 16.92 }],
    ]);

    const events = [
      { cellId: 'BTS-PL-01', timestampIso: '2026-06-01T06:30:00Z' },
      { cellId: 'BTS-PL-UNKNOWN', timestampIso: '2026-06-01T07:00:00Z' },
      { cellId: 'BTS-PL-02', timestampIso: '2026-06-01T08:15:00Z' },
    ];

    const pts = interpolateBtsTrack(events, towerMap);
    expect(pts.length).toBe(2);
    expect(pts[0].latitude).toBe(52.23);
    expect(pts[0].btsCellId).toBe('BTS-PL-01');
    expect(pts[1].latitude).toBe(52.41);
    expect(pts[1].btsCellId).toBe('BTS-PL-02');
  });
});
