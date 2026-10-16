/**
 * Tests for Photoperiod & Chronobiology Engine (BR-ZDR-007, RD-13, RD-14)
 */

import {
  calculateScheduleHours,
  calculateSolarTimes,
  timeStringToMinutes,
  minutesToTimeString,
  getRecommendedRegimeForDate,
  evaluateDailyPhotoperiod,
  generateBlindAlarms,
  PHOTOPERIOD_PRESETS,
  PhotoperiodConfig,
} from '../src/domain/photoperiod';

describe('Photoperiod Engine — Core Calculations', () => {
  test('timeStringToMinutes and minutesToTimeString round-trip accurately', () => {
    expect(timeStringToMinutes('00:00')).toBe(0);
    expect(timeStringToMinutes('08:15')).toBe(8 * 60 + 15);
    expect(timeStringToMinutes('18:45')).toBe(18 * 60 + 45);
    expect(timeStringToMinutes('23:59')).toBe(23 * 60 + 59);

    expect(minutesToTimeString(0)).toBe('00:00');
    expect(minutesToTimeString(495)).toBe('08:15');
    expect(minutesToTimeString(1125)).toBe('18:45');
  });

  test('calculateScheduleHours computes exact light and dark hours for Verdunkelung and Belichtung', () => {
    // Verdunkelung: 08:00 to 18:00 -> 10h light, 14h dark
    const verdunkelung = calculateScheduleHours('08:00', '18:00');
    expect(verdunkelung.lightHours).toBe(10);
    expect(verdunkelung.darkHours).toBe(14);

    // Belichtung: 05:00 to 21:00 -> 16h light, 8h dark
    const belichtung = calculateScheduleHours('05:00', '21:00');
    expect(belichtung.lightHours).toBe(16);
    expect(belichtung.darkHours).toBe(8);

    // Cross-midnight custom test (e.g. 20:00 to 06:00 -> 10h light, 14h dark)
    const inverted = calculateScheduleHours('20:00', '06:00');
    expect(inverted.lightHours).toBe(10);
    expect(inverted.darkHours).toBe(14);
  });

  test('calculateSolarTimes approximates realistic day lengths for Poland (lat 52°N)', () => {
    // Summer solstice (~June 21): day length should be approx 16.5-17 hours
    const summer = calculateSolarTimes(52, new Date(2026, 5, 21)); // June is month 5
    expect(summer.dayLengthHours).toBeGreaterThan(16.0);
    expect(summer.dayLengthHours).toBeLessThan(17.5);

    // Winter solstice (~Dec 21): day length should be approx 7.5-8 hours
    const winter = calculateSolarTimes(52, new Date(2026, 11, 21)); // Dec is month 11
    expect(winter.dayLengthHours).toBeGreaterThan(7.0);
    expect(winter.dayLengthHours).toBeLessThan(8.5);

    // Spring equinox (~March 21): day length should be approx 12 hours
    const equinox = calculateSolarTimes(52, new Date(2026, 2, 21)); // March is month 2
    expect(Math.abs(equinox.dayLengthHours - 12)).toBeLessThan(0.8);
  });

  test('getRecommendedRegimeForDate selects correct seasonal regime', () => {
    // Mid-April -> Verdunkelung (young birds darkness)
    expect(getRecommendedRegimeForDate(new Date(2026, 3, 15))).toBe('verdunkelung');
    expect(getRecommendedRegimeForDate(new Date(2026, 4, 10))).toBe('verdunkelung');
    expect(getRecommendedRegimeForDate(new Date(2026, 5, 20))).toBe('verdunkelung');

    // July -> Belichtung (young birds racing lighting)
    expect(getRecommendedRegimeForDate(new Date(2026, 5, 25))).toBe('belichtung');
    expect(getRecommendedRegimeForDate(new Date(2026, 6, 15))).toBe('belichtung');
    expect(getRecommendedRegimeForDate(new Date(2026, 7, 20))).toBe('belichtung');

    // November -> Natural moult & winter rest
    expect(getRecommendedRegimeForDate(new Date(2026, 10, 15))).toBe('natural');
    expect(getRecommendedRegimeForDate(new Date(2026, 0, 10))).toBe('natural');
  });
});

describe('Photoperiod Engine — Daily Evaluation & Alarms', () => {
  const sampleVerdunkelungConfig: PhotoperiodConfig = {
    id: 'cfg-1',
    loftId: 'loft-1',
    ...PHOTOPERIOD_PRESETS.verdunkelung,
  };

  test('evaluates day phase at 12:00 noon in Verdunkelung', () => {
    const noon = new Date(2026, 4, 1, 12, 0, 0);
    const evalResult = evaluateDailyPhotoperiod(sampleVerdunkelungConfig, noon);

    expect(evalResult.phase).toBe('day');
    expect(evalResult.isDarknessCompliant).toBe(true);
    expect(evalResult.minutesUntilNextTransition).toBe(6 * 60); // 18:00 - 12:00 = 360 min
    expect(evalResult.nextTransitionName).toContain('Opuszczenie rolet');
    expect(evalResult.nextTransitionTime).toBe('18:00');
  });

  test('detects closing_soon warning phase 10 min before lights off (17:50)', () => {
    const eveningWarning = new Date(2026, 4, 1, 17, 50, 0);
    const evalResult = evaluateDailyPhotoperiod(sampleVerdunkelungConfig, eveningWarning);

    expect(evalResult.phase).toBe('closing_soon');
    expect(evalResult.minutesUntilNextTransition).toBe(10);
    expect(evalResult.nextTransitionTime).toBe('18:00');
  });

  test('evaluates night phase at 22:00 in Verdunkelung', () => {
    const nightTime = new Date(2026, 4, 1, 22, 0, 0);
    const evalResult = evaluateDailyPhotoperiod(sampleVerdunkelungConfig, nightTime);

    expect(evalResult.phase).toBe('night');
    expect(evalResult.nextTransitionName).toContain('Podniesienie rolet');
    expect(evalResult.nextTransitionTime).toBe('08:00');
    // From 22:00 to 08:00 is 10 hours = 600 min
    expect(evalResult.minutesUntilNextTransition).toBe(600);
  });

  test('detects opening_soon warning phase 10 min before lights on (07:50)', () => {
    const morningWarning = new Date(2026, 4, 1, 7, 50, 0);
    const evalResult = evaluateDailyPhotoperiod(sampleVerdunkelungConfig, morningWarning);

    expect(evalResult.phase).toBe('opening_soon');
    expect(evalResult.minutesUntilNextTransition).toBe(10);
    expect(evalResult.nextTransitionTime).toBe('08:00');
  });

  test('generateBlindAlarms creates morning and evening alerts with lead time', () => {
    const alarms = generateBlindAlarms(sampleVerdunkelungConfig, 15);

    expect(alarms).toHaveLength(2);

    const openAlarm = alarms.find((a) => a.action === 'open_blinds')!;
    expect(openAlarm.time).toBe('07:45'); // 15 min before 08:00
    expect(openAlarm.eventTime).toBe('08:00');
    expect(openAlarm.title).toContain('podniesienie rolet');

    const closeAlarm = alarms.find((a) => a.action === 'close_blinds')!;
    expect(closeAlarm.time).toBe('17:45'); // 15 min before 18:00
    expect(closeAlarm.eventTime).toBe('18:00');
    expect(closeAlarm.title).toContain('opuszczenie rolet');
  });
});
