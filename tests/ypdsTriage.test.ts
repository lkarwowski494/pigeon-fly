/**
 * PIGEON-FLY — Unit Tests for YPDS (Adeno-Coli) Clinical Diagnostic & PDF Emergency Report (Z-305, RD-27)
 */

import { evaluateYpdsRisk } from '../src/domain/health';
import { generateYpdsEmergencyReportHtml } from '../src/domain/pdfExport';
import { PdfService } from '../src/services/pdfService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

describe('YPDS Triage & Clinical Emergency Report (Z-305, RD-27)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('evaluates clean bird without symptoms', () => {
    const assessment = evaluateYpdsRisk({
      symptoms: [],
      isYoungBird: true,
    });

    expect(assessment.riskLevel).toBe('none');
    expect(assessment.isEmergency).toBe(false);
    expect(assessment.quarantineRequired).toBe(false);
    expect(assessment.recommendedProtocols).toHaveLength(0);
    expect(assessment.summary).toContain('Brak objawów');
  });

  test('diagnoses acute YPDS Adeno-Coli with 3 symptoms in young bird and issues bans', () => {
    const assessment = evaluateYpdsRisk({
      symptoms: ['crop_stasis', 'vomiting', 'green_mucoid_diarrhea'],
      isYoungBird: true,
    });

    expect(assessment.riskLevel).toBe('acute');
    expect(assessment.isEmergency).toBe(true);
    expect(assessment.quarantineRequired).toBe(true);
    expect(assessment.contraindications).toContain(
      'BEZWZGLĘDNY ZAKAZ KOSZOWANIA na loty konkursowe i treningi!'
    );
    expect(assessment.recommendedProtocols.some((p) => p.title.includes('pH 4.0 - 4.2'))).toBe(true);
    expect(assessment.recommendedProtocols.some((p) => p.title.includes('Głódź lecznicza'))).toBe(true);
  });

  test('diagnoses critical collapse when 4+ symptoms present', () => {
    const assessment = evaluateYpdsRisk({
      symptoms: ['crop_stasis', 'vomiting', 'green_mucoid_diarrhea', 'rapid_weight_loss'],
      isYoungBird: true,
    });

    expect(assessment.riskLevel).toBe('critical');
    expect(assessment.isEmergency).toBe(true);
    expect(assessment.summary).toContain('KRYTYCZNE ZAGROŻENIE ŻYCIA');
  });

  test('generates complete HTML document for attending veterinarian with RD-27 protocol', () => {
    const assessment = evaluateYpdsRisk({
      symptoms: ['crop_stasis', 'green_mucoid_diarrhea'],
      isYoungBird: true,
    });

    const html = generateYpdsEmergencyReportHtml({
      loftName: 'Mistrzowski Gołębnik Rawicz',
      breederName: 'Jan Kowalski',
      pigeonRingNumber: 'PL-0284-24-9102',
      isYoungBird: true,
      date: '2026-07-15',
      symptoms: ['Wole lejące', 'Zielona biegunka'],
      riskLevel: assessment.riskLevel,
      summary: assessment.summary,
      contraindications: assessment.contraindications,
      protocols: assessment.recommendedProtocols,
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('KLINICZNY PROTOKÓŁ TRIAGE YPDS');
    expect(html).toContain('PL-0284-24-9102');
    expect(html).toContain('Mistrzowski Gołębnik Rawicz');
    expect(html).toContain('Zalecana Procedura Ratunkowa RD-27');
    expect(html).toContain('Pieczęć i podpis lekarza weterynarii');
  });

  test('exports YPDS report via PdfService in print and share modes', async () => {
    const options = {
      loftName: 'Mistrzowski Gołębnik Rawicz',
      breederName: 'Jan Kowalski',
      pigeonRingNumber: 'PL-0284-24-9102',
      isYoungBird: true,
      date: '2026-07-15',
      symptoms: ['Wole lejące'],
      riskLevel: 'acute',
      summary: 'Ostre Adeno-Coli',
      contraindications: ['Zakaz koszowania'],
      protocols: [{ title: 'Izolacja', description: 'Przenieś ptaka', priority: 'urgent' }],
    };

    // Print
    await PdfService.exportYpdsReport(options, 'print');
    expect(Print.printAsync).toHaveBeenCalled();

    // Share
    const uri = await PdfService.exportYpdsReport(options, 'share');
    expect(Print.printToFileAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalled();
    expect(uri).toBe('file:///mock/pedigree.pdf');
  });
});
