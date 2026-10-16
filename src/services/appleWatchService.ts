/**
 * Pigeon-Fly — Apple Watch Companion Service (watchOS 11 / iOS 18)
 * Zgodność ze standardem portfolio Apps4Brew (DEC-03, ZP-08, BR-ZEG-001):
 * 1. 1-tap rejestracja przylotu z nadgarstka („Spadł ptak!”) z precyzyjnym znacznikiem czasu (ms).
 * 2. Niezależny bufor offline na zegarku — działa bez zasięgu telefonu na dachu gołębnika.
 * 3. Parowanie surowego czasu przylotu z zegarka z numerem obrączki ptaka w telefonie.
 * 4. Przygotowanie zrzutów stanu aktywnego lotu dla widżetów Smart Stack i powiadomień haptycznych.
 */

export interface WatchRaceSnapshot {
  raceId: string;
  raceName: string;
  releaseTime: string;
  distanceKm: number;
  expectedArrivalStart: string;
  birdsExpected: number;
  birdsArrived: number;
  lastArrivalSpeedMpm?: number;
  lastUpdatedMs: number;
}

export interface WatchRawArrival {
  id: string;
  raceId: string;
  timestampMs: number;
  isoTime: string;
  sourceDevice: 'apple_watch';
  assignedPigeonId?: string;
  assignedRingNumber?: string;
}

export function createWatchRaceSnapshot(params: {
  raceId: string;
  raceName: string;
  releaseTime: string;
  distanceMeters: number;
  birdsExpected: number;
  birdsArrived: number;
  lastArrivalSpeedMpm?: number;
}): WatchRaceSnapshot {
  return {
    raceId: params.raceId,
    raceName: params.raceName,
    releaseTime: params.releaseTime,
    distanceKm: Math.round((params.distanceMeters / 1000) * 10) / 10,
    expectedArrivalStart: params.releaseTime,
    birdsExpected: params.birdsExpected,
    birdsArrived: params.birdsArrived,
    lastArrivalSpeedMpm: params.lastArrivalSpeedMpm,
    lastUpdatedMs: Date.now(),
  };
}

/**
 * Rejestruje naciśnięcie przycisku „Spadł ptak!” na Apple Watch.
 */
export function recordWatchArrival(
  raceId: string,
  nowMs: number = Date.now()
): WatchRawArrival {
  const d = new Date(nowMs);
  return {
    id: `warr_${nowMs}_${Math.random().toString(36).substring(2, 6)}`,
    raceId,
    timestampMs: nowMs,
    isoTime: d.toISOString(),
    sourceDevice: 'apple_watch',
  };
}

/**
 * Paruje zarejestrowany czas z zegarka z konkretnym gołębiem (np. po złapaniu ptaka w lufce).
 */
export function pairWatchArrivalWithPigeon(
  arrival: WatchRawArrival,
  pigeonId: string,
  ringNumber: string
): WatchRawArrival {
  return {
    ...arrival,
    assignedPigeonId: pigeonId,
    assignedRingNumber: ringNumber,
  };
}
