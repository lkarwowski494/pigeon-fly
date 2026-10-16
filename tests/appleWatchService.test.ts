import {
  createWatchRaceSnapshot,
  recordWatchArrival,
  pairWatchArrivalWithPigeon,
} from '../src/services/appleWatchService';

describe('Apple Watch Companion Service', () => {
  it('creates an accurate watch race snapshot with distance and progress', () => {
    const snapshot = createWatchRaceSnapshot({
      raceId: 'race-42',
      raceName: 'Peine Narodowy',
      releaseTime: '06:15:00',
      distanceMeters: 420800,
      birdsExpected: 35,
      birdsArrived: 12,
      lastArrivalSpeedMpm: 1354.2,
    });

    expect(snapshot.raceId).toBe('race-42');
    expect(snapshot.distanceKm).toBe(420.8);
    expect(snapshot.birdsExpected).toBe(35);
    expect(snapshot.birdsArrived).toBe(12);
    expect(snapshot.lastArrivalSpeedMpm).toBe(1354.2);
    expect(snapshot.lastUpdatedMs).toBeGreaterThan(0);
  });

  it('records an offline 1-tap arrival from watch with millisecond timestamp', () => {
    const fixedMs = 1773660000000;
    const rawArrival = recordWatchArrival('race-42', fixedMs);

    expect(rawArrival.raceId).toBe('race-42');
    expect(rawArrival.timestampMs).toBe(fixedMs);
    expect(rawArrival.sourceDevice).toBe('apple_watch');
    expect(rawArrival.id).toMatch(/^warr_\d+_[a-z0-9]+$/);
    expect(rawArrival.assignedPigeonId).toBeUndefined();
  });

  it('pairs an unassigned watch arrival with a pigeon', () => {
    const rawArrival = recordWatchArrival('race-42', 1773660000000);
    const paired = pairWatchArrivalWithPigeon(rawArrival, 'pigeon-99', 'PL-0284-23-4567');

    expect(paired.assignedPigeonId).toBe('pigeon-99');
    expect(paired.assignedRingNumber).toBe('PL-0284-23-4567');
    expect(paired.timestampMs).toBe(rawArrival.timestampMs);
  });
});
