/**
 * PIGEON-FLY — Private Section Mini-Derby Engine (BR-LOT-009)
 * Multi-loft real-time velocity ranking across variable geodesic distances,
 * time advantage / gaps to leader, and live race commentary feed.
 */

import { calculateGeodesicDistanceMeters } from './racing';

export interface DerbyLoft {
  loftId: string;
  loftName: string;
  fancierName: string;
  latitude: number;
  longitude: number;
  geodesicDistanceMeters: number;
}

export interface DerbyArrival {
  arrivalId: string;
  loftId: string;
  pigeonId: string;
  ringNumber: string;
  arrivalTime: string; // ISO 8601
  distanceMeters: number;
  velocityMPerMin: number;
}

export interface DerbyStanding {
  rank: number;
  loftId: string;
  loftName: string;
  fancierName: string;
  pigeonId: string;
  ringNumber: string;
  arrivalTime: string;
  distanceKm: number;
  velocityMPerMin: number;
  gapToLeaderMpm: number;
  timeDifferenceSeconds: number;
}

export interface MiniDerbyRace {
  id: string;
  name: string;
  releasePointName: string;
  releaseLat: number;
  releaseLon: number;
  releaseTime: string; // ISO 8601
  participatingLofts: DerbyLoft[];
}

/**
 * Calculates geodesic distance for a loft given release point coordinates.
 */
export function calculateLoftDerbyDistance(
  releaseLat: number,
  releaseLon: number,
  loftLat: number,
  loftLon: number
): number {
  return calculateGeodesicDistanceMeters(
    { latitude: releaseLat, longitude: releaseLon },
    { latitude: loftLat, longitude: loftLon }
  );
}

/**
 * Computes official derby standings sorted descending by flight speed (m/min).
 */
export function calculateDerbyStandings(
  derby: MiniDerbyRace,
  arrivals: DerbyArrival[]
): DerbyStanding[] {
  if (!arrivals || arrivals.length === 0) {
    return [];
  }

  // Map of loft lookup
  const loftMap = new Map<string, DerbyLoft>();
  derby.participatingLofts.forEach((loft) => loftMap.set(loft.loftId, loft));

  // Sort arrivals strictly by velocity descending (highest velocity = rank 1)
  const sortedArrivals = [...arrivals].sort((a, b) => b.velocityMPerMin - a.velocityMPerMin);

  const leader = sortedArrivals[0];
  const leaderTime = new Date(leader.arrivalTime).getTime();

  return sortedArrivals.map((arr, index) => {
    const loft = loftMap.get(arr.loftId) || {
      loftId: arr.loftId,
      loftName: 'Nieznany gołębnik',
      fancierName: 'Hodowca',
      latitude: 0,
      longitude: 0,
      geodesicDistanceMeters: arr.distanceMeters,
    };

    const currentArrTime = new Date(arr.arrivalTime).getTime();
    const timeDiffSec = Math.round((currentArrTime - leaderTime) / 1000);
    const gapMpm = parseFloat((leader.velocityMPerMin - arr.velocityMPerMin).toFixed(2));

    return {
      rank: index + 1,
      loftId: arr.loftId,
      loftName: loft.loftName,
      fancierName: loft.fancierName,
      pigeonId: arr.pigeonId,
      ringNumber: arr.ringNumber,
      arrivalTime: arr.arrivalTime,
      distanceKm: parseFloat((arr.distanceMeters / 1000).toFixed(2)),
      velocityMPerMin: parseFloat(arr.velocityMPerMin.toFixed(2)),
      gapToLeaderMpm: gapMpm,
      timeDifferenceSeconds: timeDiffSec,
    };
  });
}

/**
 * Generates automated live broadcast notification string for a new arrival in the mini-derby.
 */
export function generateDerbyLiveFeed(standing: DerbyStanding): string {
  if (standing.rank === 1) {
    return `🥇 NOWY LIDER DERBÓW! Ptak ${standing.ringNumber} (${standing.loftName} — ${standing.fancierName}) melduje się z prędkością ${standing.velocityMPerMin.toFixed(2)} m/min!`;
  } else if (standing.rank <= 3) {
    return `🥈 PODIUM! Ptak ${standing.ringNumber} (${standing.loftName}) wskakuje na ${standing.rank}. miejsce z prędkością ${standing.velocityMPerMin.toFixed(2)} m/min (-${standing.gapToLeaderMpm} m/min).`;
  } else {
    return `⏱️ Przylot: ${standing.ringNumber} (${standing.loftName}) na ${standing.rank}. pozycji (${standing.velocityMPerMin.toFixed(2)} m/min).`;
  }
}

/**
 * Generates an alphanumeric broadcast code for the mini-derby.
 */
export function generateDerbyBroadcastCode(derbyName: string, seasonYear: number): string {
  const sanitized = derbyName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 16);
  return `DERBY-${sanitized}-${seasonYear}`;
}
