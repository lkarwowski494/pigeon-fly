import {
  calculateEvaporationRate,
  evaluateCabinDehydration,
  generateCabinDehydrationReportHtml,
  CabinDehydrationInput,
} from '../src/domain/cabinDehydration';

describe('cabinDehydration (Z-085 / DEC-99)', () => {
  it('calculates baseline evaporation rate accurately at comfortable temperature', () => {
    const rate = calculateEvaporationRate(20, 60, 25);
    expect(rate).toBe(0.25); // baseline 0.25 ml/h
  });

  it('calculates elevated evaporation during thermal stress with panting and humidity', () => {
    // 32°C, 80% humidity (factor 1.2), 15 m³/h poor ventilation (factor 1.15)
    const rate = calculateEvaporationRate(32, 80, 15);
    expect(rate).toBeGreaterThan(1.5);
  });

  it('evaluates optimal hydration status when transport is short and birds are watered', () => {
    const input: CabinDehydrationInput = {
      cabinTempC: 20,
      relativeHumidityPct: 60,
      transitHours: 8,
      releaseSiteWaitHours: 4,
      ventilationM3PerHourPer100Birds: 25,
      birdsCountInCabin: 2000,
      wateringSessionsCount: 1,
      avgWaterConsumedMlPerBirdPerSession: 6,
      averagePigeonBodyWeightGrams: 420,
    };

    const report = evaluateCabinDehydration(input);

    expect(report.totalCabinHours).toBe(12);
    expect(report.grossWaterLossMlPerBird).toBe(3); // 12h * 0.25 = 3 ml
    expect(report.waterReplenishedMlPerBird).toBe(6);
    expect(report.netFluidDeficitMlPerBird).toBe(0); // completely replenished
    expect(report.dehydrationPercentBodyWeight).toBe(0);
    expect(report.riskLevel).toBe('optimal');
    expect(report.pzhgpComplianceStatus).toBe('compliant');
  });

  it('detects moderate dehydration when confinement is extended and temp is warm', () => {
    const input: CabinDehydrationInput = {
      cabinTempC: 27,
      relativeHumidityPct: 65,
      transitHours: 12,
      releaseSiteWaitHours: 6,
      ventilationM3PerHourPer100Birds: 22,
      birdsCountInCabin: 2500,
      wateringSessionsCount: 0,
      avgWaterConsumedMlPerBirdPerSession: 0,
      averagePigeonBodyWeightGrams: 420,
    };

    const report = evaluateCabinDehydration(input);

    expect(report.totalCabinHours).toBe(18);
    expect(report.grossWaterLossMlPerBird).toBeGreaterThan(10);
    expect(report.netFluidDeficitMlPerBird).toBeGreaterThan(0);
    expect(report.riskLevel).toBe('moderate_warning');
    expect(report.recommendations.some((r) => r.includes('pojenia'))).toBe(true);
  });

  it('flags critical danger and regulatory violation when long transport has zero watering', () => {
    const input: CabinDehydrationInput = {
      cabinTempC: 32,
      relativeHumidityPct: 70,
      transitHours: 16,
      releaseSiteWaitHours: 10,
      ventilationM3PerHourPer100Birds: 16, // sub-standard ventilation
      birdsCountInCabin: 3000,
      wateringSessionsCount: 0, // violation!
      avgWaterConsumedMlPerBirdPerSession: 0,
      averagePigeonBodyWeightGrams: 400,
    };

    const report = evaluateCabinDehydration(input);

    expect(report.totalCabinHours).toBe(26);
    expect(report.dehydrationPercentBodyWeight).toBeGreaterThan(4.5);
    expect(report.riskLevel).toBe('critical_danger');
    expect(report.pzhgpComplianceStatus).toBe('violation');
    expect(report.pzhgpComplianceNotes.some((n) => n.includes('Naruszenie'))).toBe(true);
    expect(report.totalFlockWaterLossLiters).toBeGreaterThan(50);
  });

  it('generates valid print-ready HTML report with welfare and convoy signatures', () => {
    const input: CabinDehydrationInput = {
      cabinTempC: 24,
      relativeHumidityPct: 60,
      transitHours: 14,
      releaseSiteWaitHours: 8,
      ventilationM3PerHourPer100Birds: 25,
      birdsCountInCabin: 2400,
      wateringSessionsCount: 2,
      avgWaterConsumedMlPerBirdPerSession: 7,
    };

    const report = evaluateCabinDehydration(input);
    const html = generateCabinDehydrationReportHtml(report, input, {
      raceName: 'Lot Narodowy Bruksela',
      cabinSerial: 'Kabina Mercedes Actros PL-8821',
      convoyLeader: 'Jan Wiśniewski',
      branchName: '0284 Nowy Tomyśl',
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Protokół Bilansu Wodnego i Mikroklimatu Kabiny');
    expect(html).toContain('Lot Narodowy Bruksela');
    expect(html).toContain('Kabina Mercedes Actros PL-8821');
    expect(html).toContain('Jan Wiśniewski');
    expect(html).toContain('22h');
  });
});
