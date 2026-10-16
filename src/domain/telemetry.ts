/**
 * PIGEON-FLY — Telemetry, IoT & GPS Flight Track Engine (Moduł 5)
 * Analyzes pigeon flight routes recorded by lightweight GPS loggers and BTS cell tower rings.
 * Computes curved path length, route efficiency ratio, max/avg speed, and corridor deviations.
 */

import { Coordinates } from './types';
import { calculateGeodesicDistanceMeters } from './racing';

export interface TelemetryPoint {
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  timestampIso: string;
  speedKmh?: number;
  batteryPct?: number;
  btsCellId?: string;
}

export interface FlightTrack {
  id: string;
  raceId?: string;
  pigeonId: string;
  ringNumber: string;
  points: TelemetryPoint[];
}

export interface TrackAnalysis {
  pointCount: number;
  startTimeIso: string;
  endTimeIso: string;
  totalDurationSeconds: number;
  actualTrackDistanceMeters: number;
  geodesicDistanceMeters: number;
  routeEfficiencyRatio: number; // e.g. 0.94 = 94% direct trajectory
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  maxAltitudeMeters: number;
  avgAltitudeMeters: number;
}

/**
 * Evaluates entire flight trajectory recorded by on-bird sensor.
 */
export function analyzeFlightTrack(track: FlightTrack): TrackAnalysis {
  const pts = track.points;
  if (!pts || pts.length === 0) {
    return {
      pointCount: 0,
      startTimeIso: '',
      endTimeIso: '',
      totalDurationSeconds: 0,
      actualTrackDistanceMeters: 0,
      geodesicDistanceMeters: 0,
      routeEfficiencyRatio: 1.0,
      maxSpeedKmh: 0,
      avgSpeedKmh: 0,
      maxAltitudeMeters: 0,
      avgAltitudeMeters: 0,
    };
  }

  if (pts.length === 1) {
    return {
      pointCount: 1,
      startTimeIso: pts[0].timestampIso,
      endTimeIso: pts[0].timestampIso,
      totalDurationSeconds: 0,
      actualTrackDistanceMeters: 0,
      geodesicDistanceMeters: 0,
      routeEfficiencyRatio: 1.0,
      maxSpeedKmh: pts[0].speedKmh || 0,
      avgSpeedKmh: pts[0].speedKmh || 0,
      maxAltitudeMeters: pts[0].altitudeMeters || 0,
      avgAltitudeMeters: pts[0].altitudeMeters || 0,
    };
  }

  let actualTrackDistance = 0;
  let maxSpeed = 0;
  let maxAltitude = 0;
  let altSum = 0;
  let altCount = 0;

  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];

    if (cur.speedKmh && cur.speedKmh > maxSpeed) {
      maxSpeed = cur.speedKmh;
    }
    if (cur.altitudeMeters !== undefined) {
      if (cur.altitudeMeters > maxAltitude) {
        maxAltitude = cur.altitudeMeters;
      }
      altSum += cur.altitudeMeters;
      altCount += 1;
    }

    if (i > 0) {
      const prev = pts[i - 1];
      const segmentDist = calculateGeodesicDistanceMeters(
        { latitude: prev.latitude, longitude: prev.longitude },
        { latitude: cur.latitude, longitude: cur.longitude }
      );
      actualTrackDistance += segmentDist;
    }
  }

  const startPt = pts[0];
  const endPt = pts[pts.length - 1];

  const geodesicDistance = calculateGeodesicDistanceMeters(
    { latitude: startPt.latitude, longitude: startPt.longitude },
    { latitude: endPt.latitude, longitude: endPt.longitude }
  );

  const startMs = new Date(startPt.timestampIso).getTime();
  const endMs = new Date(endPt.timestampIso).getTime();
  const totalDurationSeconds = Math.max(1, Math.round((endMs - startMs) / 1000));

  const avgSpeedKmh =
    totalDurationSeconds > 0
      ? Math.round(((actualTrackDistance / totalDurationSeconds) * 3.6) * 100) / 100
      : 0;

  const routeEfficiencyRatio =
    actualTrackDistance > 0
      ? Math.min(1.0, Math.round((geodesicDistance / actualTrackDistance) * 1000) / 1000)
      : 1.0;

  return {
    pointCount: pts.length,
    startTimeIso: startPt.timestampIso,
    endTimeIso: endPt.timestampIso,
    totalDurationSeconds,
    actualTrackDistanceMeters: Math.round(actualTrackDistance),
    geodesicDistanceMeters: Math.round(geodesicDistance),
    routeEfficiencyRatio,
    maxSpeedKmh: Math.round(maxSpeed * 10) / 10,
    avgSpeedKmh,
    maxAltitudeMeters: Math.round(maxAltitude),
    avgAltitudeMeters: altCount > 0 ? Math.round(altSum / altCount) : 0,
  };
}

/**
 * Parses standard CSV telemetry file exported from miniature GPS rings / loggers.
 * Expected headers: latitude,longitude,timestamp,[altitude],[speed]
 */
export function parseGpsLoggerCsv(csvContent: string): TelemetryPoint[] {
  if (!csvContent || typeof csvContent !== 'string') return [];

  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(',').map((h) => h.trim());
  const latIdx = headers.findIndex((h) => h.includes('lat'));
  const lonIdx = headers.findIndex((h) => h.includes('lon') || h.includes('lng'));
  const timeIdx = headers.findIndex((h) => h.includes('time') || h.includes('date'));
  const altIdx = headers.findIndex((h) => h.includes('alt') || h.includes('ele'));
  const speedIdx = headers.findIndex((h) => h.includes('speed') || h.includes('spd'));

  if (latIdx === -1 || lonIdx === -1) return [];

  const points: TelemetryPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((v) => v.trim());
    if (row.length <= Math.max(latIdx, lonIdx)) continue;

    const lat = parseFloat(row[latIdx]);
    const lon = parseFloat(row[lonIdx]);
    if (isNaN(lat) || isNaN(lon)) continue;

    const timeStr = timeIdx !== -1 && row[timeIdx] ? row[timeIdx] : new Date().toISOString();
    const alt = altIdx !== -1 && row[altIdx] ? parseFloat(row[altIdx]) : undefined;
    const spd = speedIdx !== -1 && row[speedIdx] ? parseFloat(row[speedIdx]) : undefined;

    points.push({
      latitude: lat,
      longitude: lon,
      timestampIso: timeStr,
      altitudeMeters: isNaN(alt || NaN) ? undefined : alt,
      speedKmh: isNaN(spd || NaN) ? undefined : spd,
    });
  }

  return points;
}

/**
 * Interpolates rough bird trajectory from cellular BTS tower handovers.
 */
export function interpolateBtsTrack(
  btsEvents: { cellId: string; timestampIso: string }[],
  btsTowerMap: Map<string, Coordinates>
): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];

  for (const ev of btsEvents) {
    const towerCoords = btsTowerMap.get(ev.cellId);
    if (towerCoords) {
      points.push({
        latitude: towerCoords.latitude,
        longitude: towerCoords.longitude,
        timestampIso: ev.timestampIso,
        btsCellId: ev.cellId,
      });
    }
  }

  return points;
}
