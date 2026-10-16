/**
 * Tests for Conformation, Eye Sign & Wing Appraisal Engine (src/domain/appraisal.ts)
 */

import { calculateAppraisalScore, AppraisalInput } from '../src/domain/appraisal';

describe('Appraisal Engine — Conformation & FCI Standard Scoring', () => {
  test('evaluates marathon endurance champion with high score', () => {
    const input: AppraisalInput = {
      pigeonId: 'p-01',
      ringNumber: 'PL-0284-23-1402',
      eyeColor: 'pearl',
      eyeSignRing: 'full_circle',
      keelStrength: 'tight_closed',
      backStrength: 'rock_solid',
      pectoralMuscleFlexibility: 5,
      featherSilkyPowder: 5,
      wingVentilation: 'excellent',
      wingStepGap: true,
    };

    const res = calculateAppraisalScore(input);

    expect(res.scoreStandardFci).toBeGreaterThanOrEqual(93.5);
    expect(res.scoreStandardFci).toBeLessThanOrEqual(95.0);
    expect(res.racingSuitability).toBe('marathon_endurance');
    expect(res.strengths.length).toBeGreaterThanOrEqual(4);
    expect(res.weaknesses.length).toBe(0);
    expect(res.suitabilityTitle).toContain('Maraton');
  });

  test('penalizes wide open keel bones and weak backs', () => {
    const input: AppraisalInput = {
      pigeonId: 'p-02',
      ringNumber: 'PL-0284-24-9999',
      eyeColor: 'yellow',
      eyeSignRing: 'absent',
      keelStrength: 'wide_open',
      backStrength: 'weak',
      pectoralMuscleFlexibility: 2,
      featherSilkyPowder: 2,
      wingVentilation: 'poor',
      wingStepGap: false,
    };

    const res = calculateAppraisalScore(input);

    expect(res.scoreStandardFci).toBeLessThanOrEqual(91.0);
    expect(res.weaknesses.length).toBeGreaterThanOrEqual(3);
    expect(res.weaknesses.some((w) => w.includes('widełki'))).toBe(true);
  });

  test('classifies sprint speed pigeon with inner speed ring and flexible muscle', () => {
    const input: AppraisalInput = {
      pigeonId: 'p-03',
      ringNumber: 'DV-01234-24-512',
      eyeColor: 'orange_red',
      eyeSignRing: 'inner_speed',
      keelStrength: 'medium',
      backStrength: 'medium',
      pectoralMuscleFlexibility: 5,
      featherSilkyPowder: 4,
      wingVentilation: 'moderate',
      wingStepGap: true,
    };

    const res = calculateAppraisalScore(input);

    expect(res.racingSuitability).toBe('sprint_speed');
    expect(res.suitabilityTitle).toContain('Sprinter');
  });
});
