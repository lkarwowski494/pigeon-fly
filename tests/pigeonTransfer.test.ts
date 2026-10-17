/**
 * PIGEON-FLY — Testy Jednostkowe E-Księgi Hodowlanej i Umów Transferu Gołębi (Z-065)
 */

import {
  evaluateTransferContract,
  generateTransferContractHtml,
  PigeonTransferContract,
} from '../src/domain/pigeonTransfer';

describe('Pigeon Transfer & Sales Agreement Engine (Z-065)', () => {
  const sampleContract: PigeonTransferContract = {
    contractNumber: 'PZHGP-TR-2026-008',
    transferDate: '2026-10-17',
    transferPlace: 'Piaseczno',
    transferType: 'SALE',
    seller: {
      name: 'Jan Kowalski',
      loftName: 'Gołębnik Mistrza',
      pzhgpBranch: '0284 Warszawa-Mokotów',
      pzhgpSection: 'Sekcja 2 Piaseczno',
      address: 'ul. Gołębia 12, 05-500 Piaseczno',
      phone: '+48 600 123 456',
    },
    buyer: {
      name: 'Marek Nowak',
      loftName: 'Lotnik Podlasia',
      pzhgpBranch: '012 Białystok',
      pzhgpSection: 'Sekcja 1',
      address: 'ul. Lipowa 5, 15-001 Białystok',
      phone: '+48 601 987 654',
    },
    pigeons: [
      {
        id: 't-1',
        ringNumber: 'PL-0284-26-101',
        year: 2026,
        sex: 'cock',
        plumageColor: 'Niebieski nakrapiany',
        hasIdentityCard: true,
        hasPedigree: true,
        hasElectronicChip: true,
        pricePln: 350,
      },
      {
        id: 't-2',
        ringNumber: 'PL-0284-26-102',
        year: 2026,
        sex: 'hen',
        plumageColor: 'Ciemna płowa',
        hasIdentityCard: true,
        hasPedigree: true,
        hasElectronicChip: false,
        pricePln: 400,
      },
    ],
    quarantineClauseAccepted: true,
    totalAgreedPricePln: 750,
    paymentMethod: 'CASH',
  };

  it('evaluates fully compliant contract as READY_TO_SIGN', () => {
    const result = evaluateTransferContract(sampleContract);

    expect(result.isValid).toBe(true);
    expect(result.statusVerdict).toBe('READY_TO_SIGN');
    expect(result.totalPigeonsCount).toBe(2);
    expect(result.identityCardsDeliveredCount).toBe(2);
    expect(result.identityCardsMissingCount).toBe(0);
    expect(result.pedigreesDeliveredCount).toBe(2);
    expect(result.totalValuePln).toBe(750);
    expect(result.warnings.length).toBe(0);
  });

  it('flags INCOMPLETE_DOCUMENTS when identity cards are missing', () => {
    const contractMissingCard: PigeonTransferContract = {
      ...sampleContract,
      pigeons: [
        sampleContract.pigeons[0],
        { ...sampleContract.pigeons[1], hasIdentityCard: false },
      ],
    };

    const result = evaluateTransferContract(contractMissingCard);

    expect(result.isValid).toBe(false);
    expect(result.statusVerdict).toBe('INCOMPLETE_DOCUMENTS');
    expect(result.identityCardsMissingCount).toBe(1);
    expect(result.warnings.some((w) => w.includes('PL-0284-26-102'))).toBe(true);
  });

  it('flags MISSING_DATA when buyer name is missing', () => {
    const incompleteContract: PigeonTransferContract = {
      ...sampleContract,
      buyer: {
        ...sampleContract.buyer,
        name: '',
      },
    };

    const result = evaluateTransferContract(incompleteContract);

    expect(result.isValid).toBe(false);
    expect(result.statusVerdict).toBe('MISSING_DATA');
    expect(result.warnings.some((w) => w.includes('danych nabywcy'))).toBe(true);
  });

  it('flags error when pigeons list is empty', () => {
    const emptyContract: PigeonTransferContract = {
      ...sampleContract,
      pigeons: [],
    };

    const result = evaluateTransferContract(emptyContract);

    expect(result.isValid).toBe(false);
    expect(result.statusVerdict).toBe('MISSING_DATA');
    expect(result.warnings.some((w) => w.includes('Brak zdefiniowanych gołębi'))).toBe(true);
  });

  it('generates official A4 HTML contract with legal clauses and signatures', () => {
    const result = evaluateTransferContract(sampleContract);
    const html = generateTransferContractHtml(sampleContract, result);

    expect(html).toContain('PZHGP-TR-2026-008');
    expect(html).toContain('Jan Kowalski');
    expect(html).toContain('Marek Nowak');
    expect(html).toContain('PL-0284-26-101');
    expect(html).toContain('PL-0284-26-102');
    expect(html).toContain('750.00 PLN');
    expect(html).toContain('Klauzula bioasekuracyjna');
    expect(html).toContain('Czytelny podpis Zbywcy');
    expect(html).toContain('Czytelny podpis Nabywcy');
  });
});
