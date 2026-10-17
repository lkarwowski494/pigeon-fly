/**
 * Unit tests for Fair-Play & Anti-Doping Declaration Domain Engine (Z-080 / DEC-94)
 */

import {
  evaluateFairPlayDeclaration,
  generateFairPlayDeclarationHtml,
  FairPlayBreederProfile,
  FairPlayClauses,
} from '../src/domain/fairPlayDeclaration';

describe('FairPlayDeclaration Domain (Z-080)', () => {
  const sampleProfile: FairPlayBreederProfile = {
    breederName: 'Łukasz Karwowski',
    pzhgpMemberNumber: '0284-1420',
    branchName: 'Oddział 0284 Gostyń',
    sectionName: 'Sekcja 1 Gostyń',
    loftAddress: 'ul. Polna 12, 63-800 Gostyń',
    loftCoordinates: '51°52\'14.2"N, 17°01\'12.4"E',
    seasonYear: 2026,
    declarationDate: '2026-04-15',
  };

  const fullClauses: FairPlayClauses = {
    antiDopingCommitment: true,
    biologicalSamplingConsent: true,
    bannedSubstancesFree: true,
    disciplinaryConsequencesAcknowledged: true,
    animalWelfareDeclaration: true,
    noActiveSuspensions: true,
  };

  test('evaluateFairPlayDeclaration returns fully compliant when all clauses accepted', () => {
    const evaluation = evaluateFairPlayDeclaration(sampleProfile, fullClauses);

    expect(evaluation.isFullyCompliant).toBe(true);
    expect(evaluation.complianceScore).toBe(100);
    expect(evaluation.missingClauses.length).toBe(0);
    expect(evaluation.statusLabel).toContain('DOPUSZCZONY');
    expect(evaluation.statusColor).toBe('#10B981');
  });

  test('evaluateFairPlayDeclaration detects missing biological sampling consent and banned substances', () => {
    const incompleteClauses: FairPlayClauses = {
      ...fullClauses,
      biologicalSamplingConsent: false,
      bannedSubstancesFree: false,
    };

    const evaluation = evaluateFairPlayDeclaration(sampleProfile, incompleteClauses);

    expect(evaluation.isFullyCompliant).toBe(false);
    expect(evaluation.complianceScore).toBe(67); // 4 / 6 = 67%
    expect(evaluation.missingClauses.length).toBe(2);
    expect(evaluation.statusLabel).toContain('BLOKADA');
    expect(evaluation.statusColor).toBe('#EF4444');
  });

  test('generateFairPlayDeclarationHtml produces valid printable HTML', () => {
    const evaluation = evaluateFairPlayDeclaration(sampleProfile, fullClauses);
    const html = generateFairPlayDeclarationHtml(evaluation);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Karta Etyki i Deklaracja Antydopingowa');
    expect(html).toContain('Łukasz Karwowski');
    expect(html).toContain('0284-1420');
    expect(html).toContain('Oddział 0284 Gostyń');
    expect(html).toContain('Bezwarunkowa Zgoda na Pobranie Próbek Biologicznych');
    expect(html).toContain('Czytelny Podpis Hodowcy');
  });
});
