/**
 * Test Suite: FCI Standard Exhibition Judging Engine (Z-054, BR-APP-004)
 * Verifies calculation of official 5 criteria scores, total points on 90-95 scale,
 * medal tiers (Gold, Silver, Bronze), Olympiad eligibility, and cage card HTML.
 */

import {
  calculateFciStandardAppraisal,
  generateFciShowCardHtml,
  FciStandardAppraisalInput,
} from '../src/domain/fciStandardAppraisal';
import fciFixture from './fixtures/fci-standard-appraisal.fixture.json';

describe('FCI Standard Exhibition Judging Engine (Z-054)', () => {
  it('validates Ground Truth test vectors from fci-standard-appraisal.fixture.json', () => {
    fciFixture.vectors.forEach((v) => {
      const sum =
        v.scores.generalAppearance +
        v.scores.boneStructure +
        v.scores.backAndTail +
        v.scores.musculature +
        v.scores.wingsAndPlumage;
      expect(sum).toBeCloseTo(v.expected_total_score, 2);

      const minKkm = v.sex === 'cock' ? fciFixture.flight_minimums_kkm.cock : fciFixture.flight_minimums_kkm.hen;
      const meetsDistance = v.kkm_2years >= minKkm;
      expect(meetsDistance).toBe(v.qualification === 'qualified');
    });
  });
  const olympicCockInput: FciStandardAppraisalInput = {
    pigeonId: 'p-01',
    ringNumber: 'PL-0284-22-1402',
    year: 2022,
    sex: 'cock',
    color: 'Niebieski nakrapiany',
    categoryStandard: 'standard_sport_cock',
    judgeName: 'Marek Nowak',
    judgeLicenseNumber: 'FCI-PL-114',
    exhibitionName: '73. Ogólnopolska Wystawa Gołębi Pocztowych',
    cageNumber: 'Klatka 042',
    headAndEye: { score: 19.0, subcriterionNotes: ['Oko wybitne'] },
    boneAndSternum: { score: 18.75, subcriterionNotes: ['Zwarte widełki'] },
    backAndLoin: { score: 18.75, subcriterionNotes: ['Szerokie plecy'] },
    musculatureAndBalance: { score: 18.75, subcriterionNotes: ['Mięśnie sprężyste'] },
    wingAndPlumage: { score: 18.5, subcriterionNotes: ['Aksamitne pióra'] },
  };

  it('awards Gold Olympic Champion and National Team eligibility for score >= 93.50', () => {
    // 19.0 + 18.75 + 18.75 + 18.75 + 18.5 = 93.75 pkt
    const result = calculateFciStandardAppraisal(olympicCockInput);

    expect(result.totalScore).toBe(93.75);
    expect(result.award).toBe('gold_olympic_champion');
    expect(result.awardTitle).toContain('Złoty Medal Standard');
    expect(result.isEligibleForNationalTeam).toBe(true);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it('awards Silver Master Class for score between 92.50 and 93.49', () => {
    const silverInput: FciStandardAppraisalInput = {
      ...olympicCockInput,
      headAndEye: { score: 18.5, subcriterionNotes: [] },
      boneAndSternum: { score: 18.5, subcriterionNotes: [] },
      backAndLoin: { score: 18.5, subcriterionNotes: [] },
      musculatureAndBalance: { score: 18.5, subcriterionNotes: [] },
      wingAndPlumage: { score: 18.75, subcriterionNotes: [] },
    }; // Total: 92.75 pkt

    const result = calculateFciStandardAppraisal(silverInput);

    expect(result.totalScore).toBe(92.75);
    expect(result.award).toBe('silver_master_class');
    expect(result.isEligibleForNationalTeam).toBe(true);
  });

  it('marks bird as disqualified if disqualifying anatomical flaws are noted', () => {
    const flawedInput: FciStandardAppraisalInput = {
      ...olympicCockInput,
      disqualifyingFlaws: ['Krzywy mostek (wada wrodzona)'],
    };

    const result = calculateFciStandardAppraisal(flawedInput);

    expect(result.award).toBe('disqualified_unclassified');
    expect(result.isEligibleForNationalTeam).toBe(false);
    expect(result.flawsIdentified).toContain('Krzywy mostek (wada wrodzona)');
  });

  it('generates valid exhibition cage card HTML markup with all details', () => {
    const result = calculateFciStandardAppraisal(olympicCockInput);
    const html = generateFciShowCardHtml(olympicCockInput, result);

    expect(html).toContain('PL-0284-22-1402');
    expect(html).toContain('73. Ogólnopolska Wystawa');
    expect(html).toContain('93.75');
    expect(html).toContain('Marek Nowak');
    expect(html).toContain('FCI-PL-114');
  });
});
