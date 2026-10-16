/**
 * Tests for QR Code Engine & Micro-sticker Identification
 */

import {
  generateQRPayload,
  parseQRPayload,
  getLostPigeonFinderUrl,
  getPedigreeVerificationUrl,
} from '../src/domain/qr';

describe('QR Engine — Micro-sticker Encoding & Parsing', () => {
  const sampleUuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const sampleRing = 'PL-0284-23-1402';

  test('encodes pigeon data into compact micro-sticker protocol payload', () => {
    const payload = generateQRPayload(sampleUuid, sampleRing);
    expect(payload).toBe(`PIGEONFLY:V1:${sampleUuid}:PL-0284-23-1402`);
  });

  test('correctly parses native PIGEONFLY protocol payload', () => {
    const raw = `PIGEONFLY:V1:${sampleUuid}:${sampleRing}`;
    const parsed = parseQRPayload(raw);

    expect(parsed.isValid).toBe(true);
    expect(parsed.version).toBe(1);
    expect(parsed.qrCodeUuid).toBe(sampleUuid);
    expect(parsed.ringNumber).toBe(sampleRing);
  });

  test('correctly parses public Lost & Found web URL', () => {
    const webUrl = `https://pigeonfly.app/find/${sampleUuid}`;
    const parsed = parseQRPayload(webUrl);

    expect(parsed.isValid).toBe(true);
    expect(parsed.qrCodeUuid).toBe(sampleUuid);
  });

  test('correctly parses pedigree verification URL', () => {
    const pedigreeUrl = `https://pigeonfly.app/pedigree/${sampleUuid}`;
    const parsed = parseQRPayload(pedigreeUrl);

    expect(parsed.isValid).toBe(true);
    expect(parsed.qrCodeUuid).toBe(sampleUuid);
  });

  test('correctly parses raw UUID string', () => {
    const parsed = parseQRPayload(sampleUuid);

    expect(parsed.isValid).toBe(true);
    expect(parsed.qrCodeUuid).toBe(sampleUuid);
  });

  test('rejects invalid or corrupted QR payload', () => {
    const parsed = parseQRPayload('INVALID_CODE_123');
    expect(parsed.isValid).toBe(false);
  });

  test('generates valid public web finder and pedigree URLs', () => {
    expect(getLostPigeonFinderUrl(sampleUuid)).toBe(`https://pigeonfly.app/find/${sampleUuid}`);
    expect(getPedigreeVerificationUrl(sampleUuid)).toBe(`https://pigeonfly.app/pedigree/${sampleUuid}`);
  });
});
