import {
  calculateWeaningDate,
  calculateBandingWindow,
  validateYoungsterTransfer,
  transferYoungstersToRacingSquad,
  generateClutchRegistryHtml,
  ClutchTransferPair,
} from '../src/domain/clutchYoungstersTransfer';

const sampleClutch: ClutchTransferPair = {
  clutchId: 'clutch-04',
  nestBox: 'Cela Rozpłodowa B-04',
  roundNumber: 1,
  sireRingNumber: 'PL-0284-21-9901',
  sireStrain: 'Janssen / De Klak',
  sireColor: 'Niebieski',
  damRingNumber: 'PL-0284-22-4410',
  damStrain: 'Gaby Vandenabeele',
  damColor: 'Pstra',
  pairingDate: '2026-02-14',
  egg1LayDate: '2026-02-23',
  egg2LayDate: '2026-02-25',
  chicks: [
    {
      id: 'chk-1',
      chickNumber: 1,
      hatchDate: '2026-03-15',
      ringNumber: 'PL-0284-26-1401',
      chipBandSerial: 'CHIP-99014',
      sex: 'cock',
      plumageColor: 'Niebieski nakrapiany',
      weaningDate: '2026-04-08',
      targetLoftSection: 'Gołębnik Młodych',
      transferredToRacingSquad: false,
    },
    {
      id: 'chk-2',
      chickNumber: 2,
      hatchDate: '2026-03-15',
      ringNumber: 'PL-0284-26-1402',
      chipBandSerial: 'CHIP-99015',
      sex: 'hen',
      plumageColor: 'Pstra',
      weaningDate: '2026-04-08',
      targetLoftSection: 'Gołębnik Młodych',
      transferredToRacingSquad: false,
    },
  ],
  notes: 'Wybitna para rozpłodowa — 100% zapłodnienia.',
};

describe('clutchYoungstersTransfer (Z-089 / DEC-103)', () => {
  it('calculates optimal weaning date 24 days post-hatch', () => {
    const weaning = calculateWeaningDate('2026-03-15');
    expect(weaning).toBe('2026-04-08');
  });

  it('calculates precise banding window (6th to 8th day post-hatch)', () => {
    const window = calculateBandingWindow('2026-03-10');
    expect(window.startDate).toBe('2026-03-16');
    expect(window.optimalDate).toBe('2026-03-17');
    expect(window.endDate).toBe('2026-03-18');
  });

  it('validates chick eligibility before transfer to racing team', () => {
    const valid = validateYoungsterTransfer(sampleClutch.chicks[0]);
    expect(valid.canTransfer).toBe(true);

    const missingRing = validateYoungsterTransfer({
      ...sampleClutch.chicks[0],
      ringNumber: '',
    });
    expect(missingRing.canTransfer).toBe(false);
    expect(missingRing.reason).toContain('obrączki');

    const alreadyTransferred = validateYoungsterTransfer({
      ...sampleClutch.chicks[0],
      transferredToRacingSquad: true,
    });
    expect(alreadyTransferred.canTransfer).toBe(false);
    expect(alreadyTransferred.reason).toContain('wcześniej');
  });

  it('transfers weaned chicks into active racing pigeon profiles with full pedigree linkage', () => {
    const result = transferYoungstersToRacingSquad(sampleClutch, 'loft-101');

    expect(result.count).toBe(2);
    expect(result.transferredPigeons).toHaveLength(2);

    const [p1, p2] = result.transferredPigeons;
    expect(p1.ringNumber).toBe('PL-0284-26-1401');
    expect(p1.fatherId).toBe('PL-0284-21-9901');
    expect(p1.motherId).toBe('PL-0284-22-4410');
    expect(p1.status).toBe('racing');
    expect(p1.sex).toBe('cock');
    expect(p1.auxiliaryRingNumber).toBe('CHIP-99014');

    expect(p2.ringNumber).toBe('PL-0284-26-1402');
    expect(p2.sex).toBe('hen');

    // Updated clutch marks chicks as transferred
    expect(result.updatedClutch.chicks.every((c) => c.transferredToRacingSquad)).toBe(true);
  });

  it('generates valid print-ready HTML breeding card with parents and chicks table', () => {
    const html = generateClutchRegistryHtml(sampleClutch, {
      loftName: 'Mistrzowski Gołębnik Wielkopolska',
      breederName: 'Marek Nowak',
      seasonYear: 2026,
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Kartoteka Rozpłodowa i Rejestr Lęgowy');
    expect(html).toContain('Cela Rozpłodowa B-04');
    expect(html).toContain('PL-0284-21-9901');
    expect(html).toContain('PL-0284-22-4410');
    expect(html).toContain('PL-0284-26-1401');
    expect(html).toContain('PL-0284-26-1402');
    expect(html).toContain('Janssen / De Klak');
    expect(html).toContain('Marek Nowak');
  });
});
