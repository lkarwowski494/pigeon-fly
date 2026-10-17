/**
 * PIGEON-FLY — Unit Tests for Nest Box Brood Card Generator & PDF Export (Z-270)
 */

import { mapNestBoxToCardItem, NestBoxItem } from '../src/domain/nestBoxMatrix';
import { generateNestBoxCardsHtml } from '../src/domain/pdfExport';
import { PdfService } from '../src/services/pdfService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

describe('Nest Box Brood Cards & PDF Engine (Z-270)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleOccupiedBox: NestBoxItem = {
    id: 'box-01',
    section: 'Sektor Rozpłód',
    boxNumber: 'A-04',
    state: 'sitting',
    cockRingNumber: 'PL-0284-23-1402',
    henRingNumber: 'PL-0284-22-9854',
    pairedDate: '2026-03-01',
    egg1Date: '2026-03-10',
    egg2Date: '2026-03-12',
    egg1Status: 'fertile',
    egg2Status: 'fertile',
    inbreedingF: 3.125,
    notes: 'Wybitna linia Gaby Vandenabeele x Janssen',
  };

  test('maps NestBoxItem to NestBoxCardItem with milestones, inbreeding, and QR payload', () => {
    const card = mapNestBoxToCardItem(sampleOccupiedBox, 1);

    expect(card.nestBox).toBe('Cela A-04');
    expect(card.roundNumber).toBe(1);
    expect(card.cockRingNumber).toBe('PL-0284-23-1402');
    expect(card.henRingNumber).toBe('PL-0284-22-9854');
    expect(card.pairedDate).toBe('2026-03-01');
    expect(card.egg1Date).toBe('2026-03-10');
    expect(card.egg2Date).toBe('2026-03-12');
    expect(card.eggStatus).toContain('Zapłodnione');
    expect(card.expectedHatchDate).toBeDefined();
    expect(card.expectedHatchDate).not.toBe('—');
    expect(card.bandingWindow).toContain('do');
    expect(card.weanedDate).toBeDefined();
    expect(card.inbreedingF).toBeCloseTo(0.03125, 4);
    expect(card.qrPayload).toBe(
      'PIGEONFLY:NESTBOX:Sektor Rozpłód:A-04:PL-0284-23-1402:PL-0284-22-9854'
    );
  });

  test('maps empty or unassigned NestBoxItem gracefully without throwing', () => {
    const emptyBox: NestBoxItem = {
      id: 'box-empty',
      section: 'Wdowce',
      boxNumber: 'B-02',
      state: 'empty',
    };

    const card = mapNestBoxToCardItem(emptyBox, 1);

    expect(card.nestBox).toBe('Cela B-02');
    expect(card.cockRingNumber).toBe('Nieobsadzona');
    expect(card.henRingNumber).toBe('Nieobsadzona');
    expect(card.pairedDate).toBe('—');
    expect(card.expectedHatchDate).toBe('—');
    expect(card.bandingWindow).toBe('—');
  });

  test('generates valid print-ready HTML with QR code, cut guides, and parent rings', () => {
    const card = mapNestBoxToCardItem(sampleOccupiedBox, 1);
    const html = generateNestBoxCardsHtml({
      loftName: 'Mistrzowski Gołębnik Gostyń',
      breederName: 'Stanisław Kowalski',
      seasonYear: 2026,
      cards: [card],
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Mistrzowski Gołębnik Gostyń');
    expect(html).toContain('Cela A-04');
    expect(html).toContain('✂ WYCIĄĆ WZDŁUŻ LINII — KARTA FRONTU CELI GNIAZDOWEJ');
    expect(html).toContain('PL-0284-23-1402');
    expect(html).toContain('PL-0284-22-9854');
    expect(html).toContain('<svg'); // Inline crisp SVG QR code
    expect(html).toContain('Obrączkowanie');
    expect(html).toContain('Młode 1 (Obrączka rodowa)');
  });

  test('exports nest box cards via PdfService in print and share mode', async () => {
    const card = mapNestBoxToCardItem(sampleOccupiedBox, 1);

    // Print mode
    await PdfService.exportNestBoxCards(
      {
        loftName: 'Mistrzowski Gołębnik',
        breederName: 'Stanisław Kowalski',
        seasonYear: 2026,
        cards: [card],
      },
      'print'
    );
    expect(Print.printAsync).toHaveBeenCalled();

    // Share mode
    const shareUri = await PdfService.exportNestBoxCards(
      {
        loftName: 'Mistrzowski Gołębnik',
        breederName: 'Stanisław Kowalski',
        seasonYear: 2026,
        cards: [card],
      },
      'share'
    );
    expect(Print.printToFileAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalled();
    expect(shareUri).toBe('file:///mock/pedigree.pdf');
  });
});
