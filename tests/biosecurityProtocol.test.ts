/**
 * PIGEON-FLY — Testy Jednostkowe Protokołu Bioasekuracji PIW (Z-062)
 */

import {
  DEFAULT_BIOSECURITY_CHECKLIST,
  evaluateBiosecurityCompliance,
  generateBiosecurityReportHtml,
  BiosecurityChecklist,
  BiosecurityLoftInfo,
} from '../src/domain/biosecurityProtocol';

describe('Biosecurity Protocol & PIW Inspection Engine (Z-062)', () => {
  const sampleLoftInfo: BiosecurityLoftInfo = {
    wniNumber: 'PL 14120099',
    loftName: 'Gołębnik Olimpijski',
    breederName: 'Jan Kowalski',
    address: 'ul. Gołębia 12, 05-500 Piaseczno',
    pzhgpBranch: '0284 Warszawa-Mokotów',
    pzhgpSection: 'Sekcja 2 Piaseczno',
    totalBirdsCount: 85,
    auditDate: '2026-10-17',
    auditorName: 'Lek. wet. Janusz Ptasiński',
    auditorRole: 'field_vet',
    auditReason: 'pre_season_check',
  };

  describe('Compliance Evaluation Engine', () => {
    it('awards 100% and FULL_COMPLIANCE for fully compliant loft', () => {
      const result = evaluateBiosecurityCompliance(DEFAULT_BIOSECURITY_CHECKLIST);

      expect(result.scorePercent).toBe(100);
      expect(result.totalPoints).toBe(result.maxPoints);
      expect(result.verdict).toBe('FULL_COMPLIANCE');
      expect(result.epizooticRisk).toBe('LOW');
      expect(result.criticalViolationsCount).toBe(0);
      expect(result.correctivePlan.length).toBe(0);
    });

    it('triggers critical violation when disinfection mat is missing', () => {
      const checklist: BiosecurityChecklist = {
        ...DEFAULT_BIOSECURITY_CHECKLIST,
        matDisinfectionActive: false,
      };

      const result = evaluateBiosecurityCompliance(checklist);

      expect(result.criticalViolationsCount).toBe(1);
      expect(result.scorePercent).toBeLessThan(100);
      expect(result.verdict).not.toBe('FULL_COMPLIANCE');
      expect(result.correctivePlan.some((p) => p.action.includes('Virkon S'))).toBe(true);
    });

    it('fails mesh aperture test when aperture exceeds 19 mm sparrow barrier limit', () => {
      const checklist: BiosecurityChecklist = {
        ...DEFAULT_BIOSECURITY_CHECKLIST,
        meshApertureMm: 25, // > 19 mm fails
      };

      const result = evaluateBiosecurityCompliance(checklist);

      const meshEval = result.evaluations.find((e) => e.id === 'wild_bird_mesh');
      expect(meshEval).toBeDefined();
      expect(meshEval?.isCompliant).toBe(false);
      expect(meshEval?.failureReason).toContain('25 mm > 19 mm');
      expect(meshEval?.deadlineDays).toBe(14);
    });

    it('flags NON_COMPLIANT and HIGH risk when multiple critical pillars fail', () => {
      const heavyViolationChecklist: BiosecurityChecklist = {
        ...DEFAULT_BIOSECURITY_CHECKLIST,
        matDisinfectionActive: false,
        validPmvVaccination: false,
        enclosedFeedStorage: false,
        internalWateringOnly: false,
        meshApertureMm: 30,
      };

      const result = evaluateBiosecurityCompliance(heavyViolationChecklist);

      expect(result.verdict).toBe('NON_COMPLIANT');
      expect(result.epizooticRisk).toBe('HIGH');
      expect(result.criticalViolationsCount).toBeGreaterThanOrEqual(4);
      expect(result.scorePercent).toBeLessThan(60);
      expect(result.correctivePlan.length).toBeGreaterThanOrEqual(4);
    });

    it('correctly handles conditional compliance when score is acceptable but minor issue exists', () => {
      const minorChecklist: BiosecurityChecklist = {
        ...DEFAULT_BIOSECURITY_CHECKLIST,
        disinfectantRenewalDays: 14, // > 7 days is non-compliant, but non-critical
        protectiveClothing: false,
        visitorLogMaintained: false,
        limeWhitewashingDone: false,
      };

      const result = evaluateBiosecurityCompliance(minorChecklist);

      expect(result.criticalViolationsCount).toBe(0);
      expect(result.scorePercent).toBeGreaterThanOrEqual(60);
      expect(result.scorePercent).toBeLessThan(85);
      expect(result.verdict).toBe('CONDITIONAL_COMPLIANCE');
      expect(result.epizooticRisk).toBe('MEDIUM');
    });
  });

  describe('A4 HTML PIW Report Generation', () => {
    it('generates complete official HTML document with WNI and signature boxes', () => {
      const result = evaluateBiosecurityCompliance(DEFAULT_BIOSECURITY_CHECKLIST);
      const html = generateBiosecurityReportHtml({
        loftInfo: sampleLoftInfo,
        checklist: DEFAULT_BIOSECURITY_CHECKLIST,
        result,
      });

      expect(html).toContain('PROTOKÓŁ KONTROLI SANITARNO-WETERYNARYJNEJ');
      expect(html).toContain('PL 14120099');
      expect(html).toContain('Jan Kowalski');
      expect(html).toContain('Gołębnik Olimpijski');
      expect(html).toContain('100%');
      expect(html).toContain('POZYTYWNY');
      expect(html).toContain('Podpis i pieczęć Lekarza Weterynarii');
      expect(html).toContain('Czytelny podpis Posiadacza Stada');
    });
  });
});
