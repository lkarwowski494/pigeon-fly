/**
 * Unit Tests for Lost & Found Portal and Rescue Reporting Engine (BR-SKAN-008)
 */

import {
  createRescueReport,
  maskBreederProfileForFinder,
  formatSosAlertNotification,
  resolveRescueReport,
} from '../src/domain/lostAndFound';

describe('Lost & Found Rescue Reporting Engine', () => {
  const loftCoord = { latitude: 51.88, longitude: 17.02 };
  const finderCoord = { latitude: 52.40, longitude: 16.92 }; // Poznań (~58 km away)

  test('creates a rescue report and accurately computes geodesic drift distance in km', () => {
    const report = createRescueReport({
      pigeonId: 'p-01',
      ringNumber: 'PL-0284-23-1402',
      qrCodeUuid: 'uuid-12345',
      finderName: 'Karolina Wiśniewska',
      finderPhone: '+48 601 234 567',
      finderAddressHint: 'Poznań, Rataje — znaleziony na balkonie',
      finderNotes: 'Ptak odpoczywa, dostał wodę z cukrem.',
      finderCoordinates: finderCoord,
      loftCoordinates: loftCoord,
    });

    expect(report.id).toBeDefined();
    expect(report.ringNumber).toBe('PL-0284-23-1402');
    expect(report.finderPhone).toBe('+48 601 234 567');
    expect(report.isResolved).toBe(false);
    expect(report.driftDistanceKm).toBeGreaterThan(50);
    expect(report.driftDistanceKm).toBeLessThan(70);
  });

  test('masks breeder private data from finder view and provides first aid instructions', () => {
    const masked = maskBreederProfileForFinder(
      'Gołębnik Mistrza',
      'PL-0284-23-1402',
      'Niebieski nakrapiany',
      '+48 600 000 000'
    );

    expect(masked.ringNumber).toBe('PL-0284-23-1402');
    expect(masked.loftName).toBe('Gołębnik Mistrza');
    expect(masked.emergencyInstructions).toContain('czystą letnią wodą');
    expect(masked.emergencyInstructions).toContain('Nie zmuszać do lotu');
  });

  test('formats urgent SOS push notification with direct contact information', () => {
    const report = createRescueReport({
      pigeonId: 'p-01',
      ringNumber: 'PL-0284-23-1402',
      qrCodeUuid: 'uuid-12345',
      finderName: 'Jan',
      finderPhone: '+48 500 111 222',
      finderAddressHint: 'Wrocław Krzyki',
      driftDistanceKm: 85.4,
    });

    const notif = formatSosAlertNotification(report);
    expect(notif.title).toContain('ALARM SOS');
    expect(notif.title).toContain('PL-0284-23-1402');
    expect(notif.body).toContain('Jan');
    expect(notif.body).toContain('Wrocław Krzyki');
    expect(notif.callPhone).toBe('+48 500 111 222');
  });

  test('resolves a rescue report with resolution timestamp', () => {
    const report = createRescueReport({
      pigeonId: 'p-01',
      ringNumber: 'PL-0284-23-1402',
      qrCodeUuid: 'uuid-12345',
      finderPhone: '+48 500 111 222',
    });

    const resolved = resolveRescueReport(report);
    expect(resolved.isResolved).toBe(true);
    expect(resolved.resolvedAtIso).toBeDefined();
  });
});
