/**
 * PIGEON-FLY — Unit Tests for Flight Energetics & Recovery Engine (RD-15, RD-16, Z-047, Z-284)
 */

import {
  calculateFlightEnergetics,
  FlightEnergeticsInput,
  FlightEnergeticsResult,
} from '../src/domain/flightEnergetics';

describe('Flight Energetics Engine — calculateFlightEnergetics', () => {
  test('evaluates short sprint race with low metabolic burn and zero catabolism', () => {
    const input: FlightEnergeticsInput = {
      distanceKm: 150,
      groundSpeedMPerMin: 1500, // 100 minutes (1.67 hours)
      airTemperatureCelsius: 18,
      headwindKmh: -10, // slight tailwind
      birdWeightGrams: 420,
      preFlightFatReserveGrams: 35,
    };

    const result = calculateFlightEnergetics(input);

    expect(result.flightDurationMinutes).toBe(100);
    expect(result.flightDurationHours).toBeCloseTo(1.67, 2);
    expect(result.fatBurnedGrams).toBeGreaterThan(1.0);
    expect(result.fatBurnedGrams).toBeLessThan(3.0);
    expect(result.muscleCatabolismRisk).toBe('none');
    expect(result.muscleProteinBurnedGrams).toBe(0);
    expect(result.recoveryProtocol.recoveryTimeDays).toBe(1);
    expect(result.recoveryProtocol.drinkerPhase1.osmolarityMOsmL).toBe(300);
  });

  test('evaluates middle distance race (400 km, neutral wind) with moderate fat expenditure', () => {
    const input: FlightEnergeticsInput = {
      distanceKm: 400,
      groundSpeedMPerMin: 1300, // ~307.7 min (5.13 hours)
      airTemperatureCelsius: 20,
      headwindKmh: 0,
      birdWeightGrams: 430,
      preFlightFatReserveGrams: 35,
    };

    const result = calculateFlightEnergetics(input);

    expect(result.flightDurationHours).toBeCloseTo(5.13, 2);
    expect(result.fatBurnedGrams).toBeGreaterThan(5.5);
    expect(result.fatBurnedGrams).toBeLessThan(8.0);
    expect(result.muscleCatabolismRisk).toBe('low');
    expect(result.muscleProteinBurnedGrams).toBe(0);
    expect(result.recoveryProtocol.recoveryTimeDays).toBe(2);
    expect(result.recoveryProtocol.feedRecommendation.feedType).toContain('Depurative');
  });

  test('evaluates tough long distance with headwind and high muscle catabolism risk', () => {
    const input: FlightEnergeticsInput = {
      distanceKm: 650,
      groundSpeedMPerMin: 1050, // ~619 min (10.3 hours)
      airTemperatureCelsius: 24,
      headwindKmh: 20, // strong headwind
      birdWeightGrams: 420,
      preFlightFatReserveGrams: 30,
    };

    const result = calculateFlightEnergetics(input);

    expect(result.flightDurationHours).toBeGreaterThan(10);
    expect(result.fatBurnedGrams).toBeGreaterThan(14);
    expect(['moderate', 'high']).toContain(result.muscleCatabolismRisk);
    expect(result.recoveryProtocol.recoveryTimeDays).toBeGreaterThanOrEqual(3);
    expect(result.recoveryProtocol.drinkerPhase2.supplements).toContain('Sedochol (cholina + metionina)');
    expect(result.recoveryProtocol.feedRecommendation.supplementsOnGrain).toContain('Białko serwatkowe / aminokwasy BCAA');
  });

  test('detects critical catabolism and muscle wasting when fat reserves depleted (RD-16)', () => {
    const input: FlightEnergeticsInput = {
      distanceKm: 850,
      groundSpeedMPerMin: 900, // ~944 min (15.7 hours)
      airTemperatureCelsius: 30, // heatwave
      headwindKmh: 25,
      birdWeightGrams: 410,
      preFlightFatReserveGrams: 18, // insufficiently conditioned bird
    };

    const result = calculateFlightEnergetics(input);

    expect(result.fatDeficit).toBe(true);
    expect(result.muscleCatabolismRisk).toBe('critical');
    expect(result.muscleProteinBurnedGrams).toBeGreaterThan(2.0);
    expect(result.postFlightWeightGrams).toBeLessThan(370);
    expect(result.recoveryProtocol.recoveryTimeDays).toBeGreaterThanOrEqual(5);
  });

  test('validates mathematical energy conservation (total kJ = sum of macronutrient burn)', () => {
    const input: FlightEnergeticsInput = {
      distanceKm: 350,
      groundSpeedMPerMin: 1200,
      airTemperatureCelsius: 18,
      headwindKmh: 5,
    };

    const result = calculateFlightEnergetics(input);

    // Fat: ~39 kJ/g, Glycogen: ~17.5 kJ/g, Protein: ~17 kJ/g
    const expectedKj =
      result.fatBurnedGrams * 39.0 +
      result.glycogenBurnedGrams * 17.5 +
      result.muscleProteinBurnedGrams * 17.0;

    expect(result.totalEnergyExpenditureKj).toBeCloseTo(expectedKj, 0);
    expect(result.postFlightWeightGrams).toBeLessThan(input.birdWeightGrams || 420);
  });

  test('increases dehydration water loss with high ambient temperature (>25°C)', () => {
    const coolFlight = calculateFlightEnergetics({
      distanceKm: 300,
      groundSpeedMPerMin: 1200,
      airTemperatureCelsius: 15,
    });

    const hotFlight = calculateFlightEnergetics({
      distanceKm: 300,
      groundSpeedMPerMin: 1200,
      airTemperatureCelsius: 32,
    });

    expect(hotFlight.waterLossMilliliters).toBeGreaterThan(coolFlight.waterLossMilliliters * 1.5);
  });
});
