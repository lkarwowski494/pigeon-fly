/**
 * Test Suite: Training Toss Planner & Route Optimizer (Z-053)
 * Verifies calculation of geodesic bearings, wind impact on speed,
 * raptor/powerline hazard penalties, and GO/NO-GO safety status.
 */

import {
  evaluateTrainingTossPlan,
  TrainingTossPlanInput,
} from '../src/domain/trainingToss';

describe('Training Toss Planner & Route Optimizer Engine (Z-053)', () => {
  const baseTossInput: TrainingTossPlanInput = {
    tossName: 'Wywózka Środowa Wdowców',
    squadType: 'widowhood_cocks',
    pigeonsCount: 30,
    homeLoft: {
      name: 'Gołębnik Macierzysty',
      coords: { latitude: 51.8700, longitude: 17.0200 }, // Gostyń
    },
    releaseLocation: {
      name: 'Rawicz (Wywózka 35 km)',
      coords: { latitude: 51.6100, longitude: 16.8500 }, // South-West of loft
      distanceKm: 35.0,
    },
    plannedReleaseHour: '07:30',
    weather: {
      windSpeedKmh: 12,
      windDirectionDeg: 210, // South-West wind (tail wind towards Gostyń!)
      visibilityKm: 15,
      temperatureC: 18,
      rainProbabilityPercent: 5,
    },
    terrain: {
      raptorThreat: 'low',
      powerLinesCrossing: false,
    },
  };

  it('approves ideal morning toss with GO_OPTIMAL status (score >= 80)', () => {
    const evaluation = evaluateTrainingTossPlan(baseTossInput);

    expect(evaluation.safetyScore).toBeGreaterThanOrEqual(80);
    expect(evaluation.status).toBe('GO_OPTIMAL');
    expect(evaluation.expectedSpeedMPerMin).toBeGreaterThan(1200); // Tailwind boost
    expect(evaluation.flightDurationMinutes).toBeLessThan(30); // 35 km in < 30 mins
    expect(evaluation.hazardsDetected).toHaveLength(0);
    expect(evaluation.optimalReleaseWindow).toContain('07:30');
  });

  it('triggers NO_GO_ABORT when fog and high rain probability are present', () => {
    const badWeatherInput: TrainingTossPlanInput = {
      ...baseTossInput,
      weather: {
        windSpeedKmh: 35,
        windDirectionDeg: 30, // Headwind
        visibilityKm: 3, // Dangerous dense fog (< 5 km)
        temperatureC: 12,
        rainProbabilityPercent: 80, // Heavy rain
      },
    };

    const evaluation = evaluateTrainingTossPlan(badWeatherInput);

    expect(evaluation.safetyScore).toBeLessThan(60);
    expect(evaluation.status).toBe('NO_GO_ABORT');
    expect(evaluation.hazardsDetected.some((h) => h.includes('opadów'))).toBe(true);
    expect(evaluation.hazardsDetected.some((h) => h.includes('widoczność'))).toBe(true);
  });

  it('penalizes toss crossing dense raptor forest corridor and powerlines', () => {
    const hazardousTerrainInput: TrainingTossPlanInput = {
      ...baseTossInput,
      terrain: {
        raptorThreat: 'high_forest',
        powerLinesCrossing: true,
      },
    };

    const evaluation = evaluateTrainingTossPlan(hazardousTerrainInput);

    expect(evaluation.safetyScore).toBeLessThan(baseTossInput.weather.rainProbabilityPercent + 75);
    expect(evaluation.hazardsDetected.some((h) => h.includes('jastrzębia'))).toBe(true);
    expect(evaluation.hazardsDetected.some((h) => h.includes('linii wysokiego napięcia'))).toBe(true);
    expect(evaluation.tacticalAdvice.some((a) => a.includes('zwartej grupie'))).toBe(true);
  });

  it('warns when distance exceeds 40 km for youngsters squad', () => {
    const youngSquadInput: TrainingTossPlanInput = {
      ...baseTossInput,
      squadType: 'youngsters',
      releaseLocation: {
        name: 'Wrocław Północ (Długa wywózka)',
        coords: { latitude: 51.2000, longitude: 16.9000 },
        distanceKm: 65.0, // Too long for early young bird toss!
      },
    };

    const evaluation = evaluateTrainingTossPlan(youngSquadInput);

    expect(evaluation.hazardsDetected.some((h) => h.includes('zbyt duży jak na wczesny etap'))).toBe(true);
  });
});
